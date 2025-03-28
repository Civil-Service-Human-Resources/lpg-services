import axios from 'axios'
import * as https from 'https'
import * as axiosLogger from './axiosLogger'
import * as config from './config'
import {getLogger} from './logger'
import {ModuleRecord} from './service/cslService/models/moduleRecord'

const logger = getLogger('learner-record')

const http = axios.create({
	baseURL: config.LEARNER_RECORD.url,
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

export async function getActiveBooking(eventId: string, user: any): Promise<any> {
	return await http.get(`/event/${eventId}/booking/${user.id}/active`, {
		headers: {
			Authorization: `Bearer ${user.accessToken}`,
		},
		validateStatus: status => {
			return status === 200 || status === 404
		},
	})
}

export async function getCancellationReasons(user: any): Promise<any> {
	return await http.get(`/event/booking/userCancellationReasons`, {
		headers: {
			Authorization: `Bearer ${user.accessToken}`,
		},
	})
}

export interface CourseRcd {
	courseId: string
	courseTitle: string
	userId: string
	modules: ModuleRecord[]
	preference?: string
	state?: string | undefined
	lastUpdated?: Date

	isComplete(): boolean
	getSelectedDate(): Date | undefined
	getType(): string | null
	getDuration(): string | null
	getCompletionDate(): Date | undefined
}
