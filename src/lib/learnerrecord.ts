import axios from 'axios'
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
	auth: config.LEARNER_RECORD.auth,
	baseURL: config.LEARNER_RECORD.url,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 5000,
})

export async function getRecord(
	user: model.User,
	course: model.Course,
	module?: model.Module,
	event?: model.Event
) {
	let activityId = course.getActivityId()
	if (event) {
		activityId = event.getActivityId()
	} else if (module) {
		activityId = module.getActivityId()
	}

	const response = await http.get(`/records/${user.id}`, {
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

export async function getLearningRecord(user: model.User) {
	const response = await http.get(`/records/${user.id}`)

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
