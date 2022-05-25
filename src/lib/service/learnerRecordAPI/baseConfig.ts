import axios, {AxiosRequestConfig} from 'axios'
import * as https from 'https'
import * as config from '../../config'
import * as model from '../../model'

export const http = axios.create({
	baseURL: config.LEARNER_RECORD.url,
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

export async function makeRequest<T>(req: AxiosRequestConfig, user: model.User) {
	if (req.headers) {
		req.headers.Authorization = `Bearer ${user.accessToken}`
	} else {
		req.headers = {Authorization: `Bearer ${user.accessToken}`}
	}
	return await http.request<T>(req)
}

export async function patch<T>(req: AxiosRequestConfig, user: model.User) {
	req.method = 'PATCH'
	req.headers = {'Content-Type': 'application/json-patch+json'}
	return makeRequest<T>(req, user)
}
