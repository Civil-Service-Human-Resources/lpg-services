import {AxiosInstance, AxiosRequestConfig} from 'axios'

import {getLogger} from '../logger'
import * as model from '../model'

const logger = getLogger('service/httpClient')

export class HttpClient {
	constructor(readonly http: AxiosInstance) {}

	async makeRequest<T>(req: AxiosRequestConfig, user: model.User): Promise<T> {
		let logMsg = `${req.method} request to ${req.url}.`
		if (req.data) {
			const stringedData = JSON.stringify(req.data)
			logMsg += ` Data: ${stringedData}`
		}
		logger.debug(logMsg)
		if (req.headers) {
			req.headers.Authorization = `Bearer ${user.accessToken}`
		} else {
			req.headers = {Authorization: `Bearer ${user.accessToken}`}
		}
		try {
			const res = await this.http.request<T>(req)
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

	async _get<T>(req: AxiosRequestConfig, user: model.User): Promise<T> {
		req.method = 'GET'
		return await this.makeRequest<T>(req, user)
	}
}
