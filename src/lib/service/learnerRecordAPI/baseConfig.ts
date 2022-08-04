import axios, {AxiosRequestConfig} from 'axios'
import * as https from 'https'
import * as config from '../../config'
import {getLogger} from '../../logger'
import * as model from '../../model'

const logger = getLogger('learnerRecordAPI/baseConfig')

export const http = axios.create({
	baseURL: config.LEARNER_RECORD.url,
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

export async function makeRequest<T>(req: AxiosRequestConfig, user: model.User): Promise<T> {
	if (req.headers) {
		req.headers.Authorization = `Bearer ${user.accessToken}`
	} else {
		req.headers = {Authorization: `Bearer ${user.accessToken}`}
	}
	try {
		const res = await http.request<T>(req)
		return res.data
	} catch (e) {
		let str = `${req.method} request to ${req.url} failed`
		if (e.response) {
			const data = JSON.stringify(e.response.data)
			str = `${str} with a status ${e.response.status}. data: ${data}`
			logger.error(str)
		}
		throw e
	}
}

export async function patch<T>(req: AxiosRequestConfig, user: model.User) {
	req.method = 'PATCH'
	req.headers = {'Content-Type': 'application/json-patch+json'}
	return await makeRequest<T>(req, user)
}
