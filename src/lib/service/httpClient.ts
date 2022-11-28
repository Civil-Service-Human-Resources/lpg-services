import axios, {AxiosInstance, AxiosRequestConfig} from 'axios'
import * as https from 'https'

import {getLogger} from '../logger'
import * as model from '../model'

const logger = getLogger('service/httpClient')

export class HttpClient {
	static createFromParams(
		baseURL: string,
		timeout: number,
		keepAlive: boolean = true,
		maxFreeSockets: number = 15,
		maxSockets: number = 100
	) {
		const http = axios.create({
			baseURL,
			httpsAgent: new https.Agent({
				keepAlive,
				maxFreeSockets,
				maxSockets,
			}),
			timeout,
		})
		return new HttpClient(http)
	}

	constructor(readonly http: AxiosInstance) {}

	async makeRequest<T>(req: AxiosRequestConfig, user: model.User): Promise<T> {
		let logMsg = `${req.method} request to ${req.url}.`
		if (req.data) {
			const stringedData = JSON.stringify(req.data)
			logMsg += ` Data: ${stringedData}`
		}
		if (req.params) {
			const stringedParams = JSON.stringify(req.params)
			logMsg += ` Params: ${stringedParams}`
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
