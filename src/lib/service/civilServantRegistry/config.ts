import axios from 'axios'
import * as https from 'https'
import * as config from '../../config'

import {HttpClient} from '../httpClient'

const http = axios.create({
	baseURL: config.REGISTRY_SERVICE_URL,
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

export const client = new HttpClient(http)
