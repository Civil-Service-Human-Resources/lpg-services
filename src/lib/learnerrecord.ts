import axios from 'axios'
import * as axiosLogger from 'lib/axiosLogger'
import * as datetime from "lib/datetime"
import * as log4js from 'log4js'
import * as query from 'querystring'
import * as config from './config'
import * as model from './model'
import * as catalog from './service/catalog'

export enum CourseState {
	Completed = 'COMPLETED',
	InProgress = 'IN_PROGRESS',
}

const logger = log4js.getLogger('learner-record')

const http = axios.create({
	baseURL: config.LEARNER_RECORD.url,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function getRecord(
	user: model.User,
	course: model.Course,
	module?: model.Module,
	event?: model.Event
) {
	let activityId = course.getActivityId()
	if (event) {
		activityId = event.getActivityId()
	} else if (module && !event) {
		activityId = module.getActivityId()
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

export async function getLearningRecord(
	user: model.User, activityIds?: string[], includeStates?: string[], ignoreStates?: string[])
	: Promise<model.Course[]> {
	const records = await getRawLearningRecord(user, activityIds, includeStates, ignoreStates)
	const courseIds = records.map(record => record.courseId)
	const courses = await catalog.list(courseIds, user)

	for (const course of courses) {
		course.record = records.find(r => r.courseId === course.id)
	}
	return courses
}

export async function getRawLearningRecord(
	user: model.User, activityIds?: string[], includeStates?: string[], ignoreStates?: string[]): Promise<CourseRecord[]> {
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

export interface EventRegistrations {
	[eventId: string]: number
}

export async function getRegistrationsForEvents(
	events: string[],
	user: model.User
): Promise<EventRegistrations> {
	const queryParam = events.join('&eventId=')
	const response = await http.get(
		`/registrations/count?eventId=${queryParam}`,
		{headers: {Authorization: `Bearer ${user.accessToken}`}}
	)

	const registrations: EventRegistrations = {}

	response.data.map((registration: {eventId: string; value: number}) => {
		registrations[registration.eventId] = registration.value
	})

	return registrations
}

export async function getReadyForFeedback(learningRecord: CourseRecord[]) {
	const readyForFeedback = []
	for (const course of learningRecord) {
		for (const module of course.modules) {
			if (!module.rated && module.state === 'COMPLETED') {
				readyForFeedback.push({
					completionDate: module.completionDate,
					course,
					module,
				})
			}
		}
	}
	return readyForFeedback.sort(
		(a, b) => b.completionDate!.getTime() - a.completionDate!.getTime()
	)
}

export function isActive(record: CourseRecord) {
	return (
		record.state !== 'ARCHIVED' &&
		record.state !== 'SKIPPED' &&
		record.preference !== 'DISLIKED'
	)
}

export class CourseRecord {
	courseId: string
	courseTitle: string
	userId: string
	modules: ModuleRecord[]
	preference?: string
	state?: string

	constructor(data: any) {
		this.courseId = data.courseId
		this.courseTitle = data.courseTitle
		this.userId = data.userId
		this.modules = data.modules || []
		this.preference = data.preference
		this.state = data.state

		for (const module of this.modules) {
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
		return durationArray.length
			? datetime.formatCourseDuration(durationArray.reduce((p, c) => p + c, 0))
			: null
	}

	getCompletionDate() {
		if (this.isComplete()) {
			let completionDate: Date | undefined
			for (const moduleRecord of this.modules) {
				if (!completionDate) {
					completionDate = moduleRecord.completionDate
				} else if (
					moduleRecord.completionDate &&
					moduleRecord.completionDate > completionDate
				) {
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
}
