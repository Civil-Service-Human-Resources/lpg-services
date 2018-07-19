import axios from 'axios'
import * as axiosLogger from 'lib/axiosLogger'
import * as log4js from 'log4js'
import * as config from './config'
import * as model from './model'

const logger = log4js.getLogger('reports')

const http = axios.create({
	baseURL: config.REPORT_SERVICE.url,
	headers: {
		'Content-Type': 'application/json',
	},
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function getLearnerRecordReport(
	user: model.User
) {
	const response = await http.get(`/learner-record/summaries`, {
		headers: { Authorization: `Bearer ${user.accessToken}` },
	})
	return response.data
}

export async function getBookingsReport(
	user: model.User
) {
	const response = await http.get(`/learner-record/events`, {
		headers: { Authorization: `Bearer ${user.accessToken}` },
	})
	return response.data
}
