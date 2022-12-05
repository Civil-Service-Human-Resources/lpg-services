import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import * as https from 'https'

import { ResourceNotFoundError } from '../exception/ResourceNotFoundError'
import { getLogger } from '../logger'
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

		http.interceptors.response.use((response: AxiosResponse): AxiosResponse<any> => {
			let logMsg = `Response from ${response.config.method} request to ${response.config.url}: ${response.status}`
			if (response.data) {
				logMsg += ` Data: ${JSON.stringify(response.data)}`
			}
			if (response.config.params) {
				logMsg += ` Params: ${JSON.stringify(response.config.params)}`
			}
			logger.debug(logMsg)
			return response
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
				if (e.response.status === 404) {
					throw new ResourceNotFoundError(req.url!)
				}
			}
			throw e
		}
	}

	async _get<T>(req: AxiosRequestConfig, user: model.User): Promise<T> {
		req.method = 'GET'
		return await this.makeRequest<T>(req, user)
	}
}
