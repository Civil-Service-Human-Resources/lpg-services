import axios, {AxiosInstance} from 'axios'
import * as https from 'https'
import * as axiosLogger from '../../../lib/axiosLogger'
import * as config from '../../../lib/config'
import * as model from '../../../lib/model'
import * as api from '../../../lib/service/catalog/api'
import {getLogger} from '../../logger'
import * as courseCatalogueClient from './courseCatalogueClient'

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
		let url = `/v2/courses/search?page=${page}&size=${size}`
		if (query) {
			url += `&searchTerm=${query}`
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
		if (user.getOrganisationCode()) {
			url += `&profileDepartments=${user.getOrganisationCode()}`
		}
		if (user.grade) {
			url += `&profileGrades=${user.grade.code}`
		}
		if (user.areaOfWork) {
			url += `&profileAreasOfWork=${user.areaOfWork.name}`
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
		console.log(response.data)
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
	user: model.User,
	departmentHierarchyCodes: string[]
): Promise<api.PageResults> {
	try {
		const response = await http.get(`/courses?mandatory=true&department=${departmentHierarchyCodes}`, {
			headers: {Authorization: `Bearer ${user.accessToken}`},
		})
		return (await convertNew(response.data, user, departmentHierarchyCodes)) as api.PageResults
	} catch (e) {
		throw new Error(`Error finding required learning - ${e}`)
	}
}

export async function get(id: string, user: model.User, departmentHierarchyCodes?: string[]) {
	try {
		const response = await http.get(`/courses/${id}`, {headers: {Authorization: `Bearer ${user.accessToken}`}})
		return await model.CourseFactory.create(response.data, user, departmentHierarchyCodes)
	} catch (e) {
		if (e.response && e.response.status === 404) {
			return null
		}
		throw new Error(`Error getting course - ${e}`)
	}
}

export async function list(ids: string[], user: model.User) {
	return await courseCatalogueClient.getCoursesWithIds(ids, user)
}

async function convertNew(data: any, user?: model.User, usersOrganisationHierarchy?: string[]) {
	if (data.results) {
		data.results = await Promise.all(
			data.results.map(async (d: any) => await model.CourseFactory.create(d, user, usersOrganisationHierarchy))
		)
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
