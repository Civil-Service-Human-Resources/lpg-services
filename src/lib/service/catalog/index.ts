import axios, {AxiosInstance} from 'axios'
import * as https from 'https'
import * as axiosLogger from '../../../lib/axiosLogger'
import * as config from '../../../lib/config'
import * as model from '../../../lib/model'
import {getLogger} from '../../logger'

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
