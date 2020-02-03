import axios from 'axios'
import * as https from 'https'
import * as config from './config'

function create(token: string) {
	const http = axios.create({
		baseURL: config.AUTHENTICATION.serviceUrl,
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		httpsAgent: new https.Agent({
			keepAlive: true,
			maxFreeSockets: 10,
			maxSockets: 100,
		}),
		timeout: config.REQUEST_TIMEOUT,
	})

	return http
}

export async function getDetails(token: string) {
	const http = create(token)
	const response = await http.get(`/oauth/resolve`)
	return response.data
}

export async function logout(token: string) {
	const http = create(token)
	const response = await http.get(`/oauth/logout`)
	return response.data
}
