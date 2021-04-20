import axios, {AxiosInstance} from 'axios'
import * as https from "https"
import * as axiosLogger from 'lib/axiosLogger'
import * as config from 'lib/config'
import * as model from 'lib/model'
import * as api from 'lib/service/catalog/api'
import {getLogger} from 'lib/logger'
import * as query from 'querystring'

const logger = getLogger('catalog')

const http: AxiosInstance = axios.create({
	baseURL: config.COURSE_CATALOGUE.url,
	headers: {
		'Content-Type': 'application/json',
	},
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function loadSearch(user: model.User) {
	await http.get(`/search/create`, {headers: {Authorization: `Bearer ${user.accessToken}`}})
}

export async function add(course: model.Course, user: model.User) {
	try {
		if (course.id) {
			await http.put(`/courses/${course.id}`, course, {headers: {Authorization: `Bearer ${user.accessToken}`}})
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

export async function postFeedback(feedback: model.Feedback, user: model.User) {
	try {
		const response = await http.post(`/feedback`, feedback, {headers: {Authorization: `Bearer ${user.accessToken}`}})
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
	user: model.User,
	page: number,
	size: number,
	query?: string,
	courseTypes?: string[],
	cost?: string,
	areasOfWork?: string[],
	departments?: string[],
	interests?: string[]
): Promise<api.SearchResults> {
	try {
		let url = `/search/courses?page=${page}&size=${size}`
		if (query) {
			url += `&query=${query}`
		}
		if (cost) {
			url += `&cost=${cost}`
		}
		if (courseTypes) {
			url += `&types=${courseTypes.join('&types=')}`
		}
		if (areasOfWork) {
			url += `&areasOfWork=${areasOfWork.join('&areasOfWork=')}`
		}
		if (departments) {
			url += `&departments=${departments.join('&departments=')}`
		}
		if (interests) {
			url += `&interests=${interests.join('&interests=')}`
		}
		if (user.department) {
			url += `&profileDepartments=${user.department}`
		}
		if (user.grade) {
			url += `&profileGrades=${user.grade.code}`
		}
		if (user.areasOfWork) {
			url += `&profileAreasOfWork=${user.areasOfWork.join('&profileAreasOfWork=')}`
		}
		if (user.otherAreasOfWork) {
			for (const areaOfWork of user.otherAreasOfWork) {
				url += `&profileAreasOfWork=${areaOfWork.name}`
			}
		}
		if (user.interests) {
			url += `&profileInterests=${user.interests.join('&profileInterests=')}`
		}

		const response = await http.get(url, {headers: {Authorization: `Bearer ${user.accessToken}`}})
		return convertToMixed(response.data, user) as api.SearchResults
	} catch (e) {
		if (e.response && e.response.status === 400) {
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
			`/courses?mandatory=true&department=${user.department}`, {headers: {Authorization: `Bearer ${user.accessToken}`}}
			// This is the new endpoint in learning-catalogue to call when you chose
			// to replace the old endpoint called from above
			//	`/courses/getrequiredlearning`, {headers: {Authorization: `Bearer ${user.accessToken}`}}
		)
		return convert(response.data, user) as api.PageResults
	} catch (e) {
		throw new Error(`Error finding required learning - ${e}`)
	}
}

export class ApiParameters {
	constructor(
		public areaOfWork: string[],
		public department: string,
		public interest: string[],
		public grade: string,
		public page: number = 0,
		public size: number = 6
	) {}
	serialize(): string {
		return query.stringify(this as any)
	}
}

export async function findSuggestedLearningWithParameters(
	user: model.User,
	parameters: string
): Promise<api.PageResults> {
	try {
		const response = await http.get(`/courses?${parameters}`, {headers: {Authorization: `Bearer ${user.accessToken}`}})
		return convert(response.data, user) as api.PageResults
	} catch (e) {
		throw new Error(`Error finding suggested learning - ${e}`)
	}
}

export async function get(id: string, user: model.User) {
	try {
		const response = await http.get(`/courses/${id}`, {headers: {Authorization: `Bearer ${user.accessToken}`}})
		return model.Course.create(response.data, user)
	} catch (e) {
		if (e.response && e.response.status === 404) {
			return null
		}
		throw new Error(`Error getting course - ${e}`)
	}
}

export async function list(ids: string[], user: model.User) {
	if (ids.length === 0) {
		return []
	}
	try {
		const response = await http.post(`/courses/getIds`,
			ids, {headers: {Authorization: `Bearer ${user.accessToken}`}})
		return response.data.map((r: any) => model.Course.create(r, user))
	} catch (e) {
		if (e.response && e.response.status === 404) {
			return null
		}
		throw new Error(`Error getting course - ${e}`)
	}
}

export async function listAll(user: model.User): Promise<api.PageResults> {
	try {
		const response = await http.get(`/courses?size=999&page=0`, {headers: {Authorization: `Bearer ${user.accessToken}`}})
		return convert(response.data) as api.PageResults
	} catch (e) {
		throw new Error(`Error listing all courses - ${e}`)
	}
}

function convert(data: any, user?: model.User) {
	if (data.results) {
		data.results = data.results.map((d: any) => model.Course.create(d, user))
	}
	return data
}

function convertToMixed(data: any, user?: model.User) {
	if (data.results) {
		data.results = data.results.map((result: model.Course) => {
			return model.CourseModule.createFromCourse(model.Course.create(result, user))
		})
	}
	return data
}
