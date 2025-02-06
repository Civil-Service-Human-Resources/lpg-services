import {AxiosInstance, AxiosRequestConfig} from 'axios'

import * as model from '../../model'
import {HttpClient} from '../httpClient'

export class LearnerRecordClient extends HttpClient {
	constructor(readonly httpClient: AxiosInstance) {
		super(httpClient)
	}

	async patch<T>(req: AxiosRequestConfig, user: model.User) {
		req.method = 'PATCH'
		req.headers = {'Content-Type': 'application/json-patch+json'}
		return await this.makeRequest<T>(req, user)
	}
}
