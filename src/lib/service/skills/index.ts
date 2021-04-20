import axios, {AxiosInstance} from 'axios'
import * as https from "https"
import * as axiosLogger from 'lib/axiosLogger'
import * as config from 'lib/config'
import * as model from "lib/model"
import {getLogger} from 'lib/logger'

import {AnswerSubmission, Question, QuizHistory, QuizMetadata, SelectedAnswers} from "lib/service/skills/api"

const logger = getLogger('skills')

const http: AxiosInstance = axios.create({
	baseURL: config.REGISTRY_SERVICE_URL,
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

export async function getQuizQuestions(professionId: number, limit: number, user: model.User): Promise<Question[]> {
	try {
		const response = await http.get(`/api/quiz?professionId=${professionId}&limit=${limit}`, getAuthorizationHeader(user))
		return response.data as Question[]
	} catch (e) {
		throw new Error('Error searching quizzes')
	}
}

export async function getQuizMetadata(professionId: number, user: model.User): Promise<QuizMetadata> {
	try {
		const response = await http.get(`/api/quiz/${professionId}/info`, getAuthorizationHeader(user))
		return response.data as QuizMetadata
	} catch (e) {
		throw new Error('Error getting quiz metadata')
	}
}

export async function submitAnswers(selectedAnswers: SelectedAnswers, user: model.User): Promise<number> {
	try {
		const response = await http.post(`/api/quiz/submit-answers`, selectedAnswers,
			getAuthorizationHeader(user))
		return response.data as number
	} catch (e) {
		throw new Error('Error submitting answers')
	}

}

export async function getResultsSummary(quizResultId: number, user: model.User): Promise<AnswerSubmission> {
	try {
		const response = await http.get(
			`/api/quiz/quiz-summary?quizResultId=${quizResultId}&staffId=${user.id}`,
			getAuthorizationHeader(user)
		)
		return response.data as AnswerSubmission
	} catch (e) {
		throw new Error('Error getting result summary')
	}
}

export async function getQuizHistory(user: model.User): Promise<QuizHistory> {
	try {
		const response = await http.get(`/api/quiz/quiz-history?staffId=${user.id}`, getAuthorizationHeader(user))
		if (response.status === 204) {
			return {quizResultDto: []}
		}
		return response.data as QuizHistory
	} catch (e) {
		throw new Error('Error getting quiz history')
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

function getAuthorizationHeader(user: model.User) {
	return {
		headers: {
			Authorization: `Bearer ${user.accessToken}`,
		},
	}
}
