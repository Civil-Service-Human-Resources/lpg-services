import axios, {AxiosInstance} from 'axios'
import * as https from "https"
import * as axiosLogger from 'lib/axiosLogger'
import * as config from 'lib/config'
import * as log4js from 'log4js'

import {Question, Quiz} from "lib/service/skills/api"

const logger = log4js.getLogger('skills')

const http: AxiosInstance = axios.create({
	baseURL: config.REGISTRY_SERVICE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 1000,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function searchQuiz(professionId: number, limit: number): Promise<Quiz> {
	try {
		const response = await http.get(`/quizzes?professionId=${professionId}&limit=${limit}`)
		return new Quiz(response.data as Question[])
	} catch (e) {
		throw new Error('Error searching quizzes')
	}
}

export async function getPurchaseOrder(code: string): Promise<boolean> {
	try {
		return await http.get(`/purchaseOrders/${code}`)
			.then(response => {
				return response.status === 200
			}).catch(() => {
				return false
			})
	} catch (e) {
		throw new Error('Error getting purchase order')
	}
}
