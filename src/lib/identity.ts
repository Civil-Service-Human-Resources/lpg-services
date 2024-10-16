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
			maxFreeSockets: 15,
			maxSockets: 100,
		}),
		timeout: config.REQUEST_TIMEOUT,
	})

	return http
}

export class IdentityDetails {
	constructor(public username: string, public uid: string, public roles: string[]) { }
}

export async function logout(token: string) {
	const http = create(token)
	const response = await http.get(config.AUTHENTICATION.endpoints.logout)
	return response.data
}
