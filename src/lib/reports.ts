import axios from 'axios'
import * as https from "https"
import * as axiosLogger from 'lib/axiosLogger'
import {getLogger} from 'lib/logger'
import * as config from './config'
import * as model from './model'

const logger = getLogger('reports')

const http = axios.create({
	baseURL: config.REPORT_SERVICE.url,
	headers: {
		'Content-Type': 'application/json',
	},
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function getLearnerRecordReport(user: model.User) {
	const response = await http.get(`/learner-record/summaries`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
	})
	return response.data
}

export async function getBookingsReport(user: model.User) {
	const response = await http.get(`/learner-record/events`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
	})
	return response.data
}
