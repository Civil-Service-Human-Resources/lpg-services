import axios from 'axios'
import * as log4js from 'log4js'
import * as config from './config'
import * as model from './model'
import * as catalog from './service/catalog'

export enum CourseState {
	Completed = 'completed',
	InProgress = 'in-progress',
}

const logger = log4js.getLogger('learner-record')

const http = axios.create({
	auth: config.LEARNER_RECORD.auth,
	baseURL: config.LEARNER_RECORD.url,
})

export async function getCourseRecord(user: model.User, course: model.Course) {
	const response = await http.get(`/records/${user.id}`, {
		params: {
			activityId: course.getActivityId(),
		},
	})
	if (response.data.records.length > 0) {
		const record = response.data.records[0]
		const uriParts = record.courseId.match(/courses\/([^\/]+)(\/([^\/]+))?/)
		const selectedDate = uriParts[3]
		if (record.completionDate) {
			record.completionDate = new Date(record.completionDate)
		}
		if (selectedDate) {
			record.selectedDate = new Date(selectedDate)
		}
		return record
	}
	return null
}

export async function getLearningRecordOf(
	courseState: CourseState | null,
	user: model.User
) {
	const response = await http.get(`/records/${user.id}`, {
		params: {
			state: courseState,
		},
	})

	const courses = []
	for (const record of response.data.records) {
		const activityId = record.courseId
		const uriParts = activityId.match(/courses\/([^\/]+)(\/([^\/]+))?/)
		const courseId = uriParts[1]
		const selectedDate = uriParts[3]
		const course = await catalog.get(courseId)
		if (!course) {
			logger.warn(
				`LRS data for course that doesn't exist. User ID: ${
					user.id
				}, course URI: ${activityId}`
			)
			continue
		}
		course.completionDate = record.completionDate
			? new Date(record.completionDate)
			: null
		course.selectedDate = selectedDate ? new Date(selectedDate) : null
		course.result = record.result
		course.preference = record.preference
		course.score = record.score
		course.state = record.state
		courses.push(course)
	}
	return courses
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

export interface Registration {
	activityId: string
	course: model.Course
	lastUpdated: Date
	selectedDate: Date
	state: string
	userId: string
}
