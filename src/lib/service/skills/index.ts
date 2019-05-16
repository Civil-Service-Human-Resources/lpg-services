import axios, {AxiosInstance} from 'axios'
import * as axiosLogger from 'lib/axiosLogger'
import * as config from 'lib/config'
import * as log4js from 'log4js'

import {Quiz} from "lib/service/skills/api"

const logger = log4js.getLogger('skills')

const http: AxiosInstance = axios.create({
	baseURL: config.REGISTRY_SERVICE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function searchQuiz(professionId: number, limit: number): Promise<Quiz> {
	try {
		const response = await http.get(`/quizzes/professionId=${professionId}&limit=${limit}`)
		return response.data as Quiz
	} catch (e) {
		throw new Error('Error searching quizzes')
	}
}
