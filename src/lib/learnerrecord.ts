import axios from 'axios'
import * as https from 'https'
import * as query from 'querystring'
import * as axiosLogger from './axiosLogger'
import * as config from './config'
import * as datetime from './datetime'
import {getLogger} from './logger'
import * as model from './model'

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

export async function getRecord(user: model.User, course: model.Course, module?: model.Module, event?: model.Event) {
	let activityId = course.id
	if (event) {
		activityId = event.id
	} else if (module && !event) {
		activityId = module.id
	}

	const response = await http.get(`/records/${user.id}`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
		params: {
			activityId,
		},
	})
	if (response.data.records.length > 0) {
		const record = response.data.records[0]
		return convert(record)
	}
	return null
}

export async function getRawLearningRecord(
	user: model.User,
	activityIds?: string[],
	includeStates?: string[],
	ignoreStates?: string[]
): Promise<CourseRecord[]> {
	const params = {
		activityId: activityIds,
		ignoreState: ignoreStates,
		includeState: includeStates,
	}
	const response = await http.get(`/records/${user.id}?${query.stringify(params)}`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
	})
	return response.data.records.map(convert)
}

function convert(record: CourseRecord) {
	return new CourseRecord(record)
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

export class CourseRecord implements CourseRcd {
	courseId: string
	courseTitle: string
	userId: string
	modules: ModuleRecord[]
	preference?: string
	state?: string | undefined
	lastUpdated?: Date

	constructor(data: any) {
		this.courseId = data.courseId
		this.courseTitle = data.courseTitle
		this.userId = data.userId
		this.modules = data.modules || []
		this.preference = data.preference
		this.state = data.state

		if (data.lastUpdated) {
			this.lastUpdated = new Date(data.lastUpdated)
		}

		for (const module of this.modules) {
			if (module.createdAt) {
				module.createdAt = new Date(module.createdAt)
			}
			if (module.updatedAt) {
				module.updatedAt = new Date(module.updatedAt)
			}
			if (module.completionDate) {
				module.completionDate = new Date(module.completionDate)
			}
			if (module.eventDate) {
				module.eventDate = new Date(module.eventDate)
			}
		}
	}

	isComplete() {
		return this.state === 'COMPLETED'
	}

	getSelectedDate() {
		for (const moduleRecord of this.modules) {
			if (moduleRecord.eventDate) {
				return moduleRecord.eventDate
			}
		}
		return undefined
	}

	getType() {
		if (!this.modules.length) {
			return null
		}
		if (this.modules.length > 1) {
			return 'blended'
		}
		return this.modules[0].moduleType
	}

	getDuration() {
		const durationArray = this.modules.map(m => m.duration || 0)
		return durationArray.length ? datetime.formatCourseDuration(durationArray.reduce((p, c) => p + c, 0)) : null
	}

	getCompletionDate() {
		if (this.isComplete()) {
			let completionDate: Date | undefined
			for (const moduleRecord of this.modules) {
				if (!completionDate) {
					completionDate = moduleRecord.completionDate
				} else if (moduleRecord.completionDate && moduleRecord.completionDate > completionDate) {
					completionDate = moduleRecord.completionDate
				}
			}
			return completionDate
		}
		return undefined
	}
}

export interface ModuleRecord {
	completionDate?: Date
	eventId?: string
	eventDate?: Date
	moduleId: string
	moduleTitle: string
	moduleType: string
	optional: boolean
	cost?: number
	duration?: number
	rated?: boolean
	state?: string
	bookingStatus?: string
	createdAt?: Date
	updatedAt?: Date
	displayState?: string
}
