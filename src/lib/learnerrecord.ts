import axios from 'axios'
import * as axiosLogger from 'lib/axiosLogger'
import * as log4js from 'log4js'
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
		console.log(event.id)
	} else if (module && !event) {
		activityId = module.getActivityId()
	}

	const response = await http.get(`/records/${user.id}`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
		params: {
			eventId: activityId,
		},
	})
	if (response.data.records.length > 0) {
		const record = response.data.records[0]
		return convert(record)
	}
	return null
}

export async function getLearningRecord(user: model.User) {
	const response = await http.get(`/records/${user.id}`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
	})

	const courses: model.Course[] = []
	for (let record of response.data.records) {
		record = convert(record)
		const course = await catalog.get(record.courseId)
		if (!course) {
			logger.warn(
				`LRS data for course that doesn't exist. User ID: ${
					user.id
				}, course : ${record.courseId}`
			)
			continue
		}
		course.record = record
		courses.push(course)
	}
	return courses
}

function convert(record: CourseRecord) {
	record.courseId = uriToId('courses', record.courseId)!
	for (const module of record.modules) {
		module.moduleId = uriToId('modules', module.moduleId)!
		if (module.completionDate) {
			module.completionDate = new Date(module.completionDate)
		}
		if (module.eventId) {
			module.eventId = uriToId('events', module.eventId)
		}
	}
	return record
}

function uriToId(type: string, uri: string) {
	if (!uri) {
		return undefined
	}
	const match = uri.match(new RegExp(`${type}/([^/]+)`))
	if (match) {
		return match[1]
	}
	return undefined
}

export async function getRegistrations() {
	const response = await http.get('/registrations')

	const registrations: Registration[] = []
	for (const data of response.data.registrations) {
		const uriParts = data.courseId.match(/courses\/([^\/]+)(\/([^\/]+))?/)
		const courseId = uriParts[1]
		const selectedDate = uriParts[3]
		const course = await catalog.get(courseId)
		if (!course) {
			logger.warn(
				`LRS data for course that doesn't exist. course URI: ${data.activityId}`
			)
			continue
		}
		registrations.push({
			activityId: data.courseId,
			course,
			lastUpdated: new Date(data.lastUpdated),
			selectedDate: new Date(selectedDate),
			state: data.state,
			userId: data.userId,
		})
	}
	return registrations
}

export interface EventRegistrations {
	[eventId: string]: number
}

export async function getRegistrationsForEvents(
	events: string[],
	user: model.User
): Promise<EventRegistrations> {
	const queryParam = events
		.map((eventId: string) => {
			return `${config.XAPI.eventBaseUri}/${eventId}`
		})
		.join('&eventId=')

	const response = await http.get(
		`/registrations/count?eventId=${queryParam}`,
		{headers: {Authorization: `Bearer ${user.accessToken}`}}
	)

	const registrations: EventRegistrations = {}

	response.data.map((registration: {eventId: string; value: number}) => {
		registrations[
			registration.eventId.substr(config.XAPI.eventBaseUri.length + 1)
		] =
			registration.value
	})

	return registrations
}

export async function getReadyForFeedback(learningRecord: model.Course[]) {
	const readyForFeedback = []
	for (const course of learningRecord) {
		for (const moduleRecord of course.record!.modules) {
			if (!moduleRecord.rated && moduleRecord.state === 'COMPLETED') {
				readyForFeedback.push({
					completionDate: moduleRecord.completionDate,
					course,
					module: course.modules.find(m => m.id === moduleRecord.moduleId),
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
		record.state !== 'UNREGISTERED' &&
		record.preference !== 'DISLIKED'
	)
}

export interface CourseRecord {
	courseId: string
	userId: string
	modules: ModuleRecord[]
	preference?: string
	state?: string
}

export interface ModuleRecord {
	completionDate?: Date
	eventId?: string
	moduleId: string
	rated?: boolean
	state?: string
}

export interface Registration {
	activityId: string
	course: model.Course
	lastUpdated: Date
	selectedDate: Date
	state: string
	userId: string
}
