import axios, {AxiosInstance} from 'axios'
import * as log4js from 'log4js'
import * as query from 'querystring'

import * as axiosLogger from 'lib/axiosLogger'
import * as config from 'lib/config'
import * as model from 'lib/model'
import * as api from 'lib/service/catalog/api'

const logger = log4js.getLogger('catalog')

const http: AxiosInstance = axios.create({
	auth: config.COURSE_CATALOGUE.auth,
	baseURL: config.COURSE_CATALOGUE.url,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function loadSearch() {
	await http.get(`/search/create`)
}

export async function add(course: model.Course) {
	try {
		if (course.id) {
			await http.put(`/courses/${course.id}`, course)
			return course.id
		}
		const response = await http.post(`/courses`, course)
		return response.headers.location.match(/.*courses\/([^/]+)/)[1]
	} catch (e) {
		throw new Error(
			`Error adding or updating course (${
				course.id
			}) to course catalogue - ${e}`
		)
	}
}

export async function postFeedback(feedback: model.Feedback) {
	try {
		const response = await http.post(`/feedback`, feedback)
		return response.headers.location.match(/.*feedback\/([^/]+)/)[1]
	} catch (e) {
		throw new Error(
			`Error adding or updating feedback (${
				feedback.id
			}) to course catalogue - ${e}`
		)
	}
}

export async function search(
	query: string,
	page: number,
	size: number,
	courseType?: string,
	cost?: string
): Promise<api.SearchResults> {
	try {
		const response = await http.get(
			`/search?query=${query}&page=${page}&size=${size}&type=${courseType}&cost=${cost}`
		)
		return convertToMixed(response.data) as api.SearchResults
	} catch (e) {
		if (e.response.status === 400) {
			return {
				combinedResults: [],
				page: 0,
				results: [],
				size: 0,
				totalResults: 0,
			}
		}
		throw new Error(`Error searching for courses - ${e}`)
	}
}

export async function findRequiredLearning(
	user: model.User
): Promise<api.PageResults> {
	try {
		const response = await http.get(
			`/courses?mandatory=true&department=${user.department}`
		)
		const data = response.data
		data.results = data.results.map(model.Course.create)
		return data as api.PageResults
	} catch (e) {
		throw new Error(`Error finding required learning - ${e}`)
	}
}

// interests are distinct from areas of work and department and
// so are seperate parameters
export class ApiParametersByInterest {
	constructor(
		public interest: string[],
		public page: number = 0,
		public size: number = 6
	) {}
	serialize(): string {
		return query.stringify(this)
	}
}

export class ApiParameters {
	constructor(
		public areaOfWork: string[],
		public department: string,
		public page: number = 0,
		public size: number = 6
	) {}
	serialize(): string {
		return query.stringify(this)
	}
}

export async function findSuggestedLearningWithParameters(
	parameters: string
): Promise<api.PageResults> {
	try {
		const response = await http.get(`/courses?${parameters}`)
		return convert(response.data) as api.PageResults
	} catch (e) {
		throw new Error(`Error finding suggested learning - ${e}`)
	}
}

export async function get(id: string) {
	try {
		const response = await http.get(`/courses/${id}`)
		return model.Course.create(response.data)
	} catch (e) {
		if (e.response.status === 404) {
			return null
		}
		throw new Error(`Error getting course - ${e}`)
	}
}

export async function listAll(): Promise<api.PageResults> {
	try {
		const response = await http.get(`/courses?size=999&page=0`)
		return convert(response.data) as api.PageResults
	} catch (e) {
		throw new Error(`Error listing all courses - ${e}`)
	}
}

function convert(data: any) {
	if (data.results) {
		data.results = data.results.map(model.Course.create)
	}
	return data
}

function convertToMixed(data: any) {
	if (data.results) {
		data.results = data.results.map((result: model.Resource) => {
			return result.courseId === '0'
				? model.CourseModule.createFromCourse(model.Course.create(result))
				: model.CourseModule.createFromModule(
						model.Module.create(result),
						result.course
				)
		})
	}
	return data
}
