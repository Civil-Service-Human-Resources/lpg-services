import axios from 'axios'
import * as config from 'lib/config'
import * as model from 'lib/model'
import * as api from 'lib/service/catalog/api'

const http = axios.create({
	auth: config.COURSE_CATALOGUE.auth,
	baseURL: config.COURSE_CATALOGUE.url,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 5000,
})

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

export async function search(query: string): Promise<api.TextSearchResponse> {
	try {
		const response = await http.get(`/search?query=${query}`)
		return response.data as api.TextSearchResponse
	} catch (e) {
		throw new Error(`Error searching for courses - ${e}`)
	}
}

export async function findRequiredLearning(
	user: model.User
): Promise<api.SearchResponse> {
	try {
		const response = await http.get(
			`/courses?mandatory=true&department=${user.department}`
		)
		return {entries: response.data.results.map(model.Course.create)}
	} catch (e) {
		throw new Error(`Error finding required learning - ${e}`)
	}
}

export async function findSuggestedLearning(
	user: model.User
): Promise<api.SearchResponse> {
	try {
		const response = await http.get(
			`/courses?&department=${user.department}&areaOfWork=${user.profession}`
		)
		return {entries: response.data.results.map(model.Course.create)}
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

export async function listAll(): Promise<api.SearchResponse> {
	try {
		const response = await http.get(`/courses`)
		return {entries: response.data.results.map(model.Course.create)}
	} catch (e) {
		throw new Error(`Error listing all courses - ${e}`)
	}
}
