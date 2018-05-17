import axios from 'axios'
import * as config from './config'

function create(token: string) {
	const http = axios.create({
		baseURL: config.AUTHENTICATION.serviceUrl,
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		timeout: 5000,
	})

	return http
}

export async function getDetails(token: string) {
	const http = create(token)
	const response = await http.get(`/oauth/resolve`)
	return response.data
}
