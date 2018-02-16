import axios from 'axios'
import * as config from './config'
import * as catalog from './service/catalog'
import * as model from './model'
import * as log4js from 'log4js'

const logger = log4js.getLogger('learner-record')

export interface Record {}

export enum CourseState {
	Completed = 'completed',
	InProgress = 'in-progress',
}

export async function getLearningRecordOf(
	courseState: CourseState,
	user: model.User
) {
	const response = await axios({
		method: 'get',
		params: {
			state: courseState,
		},
		url: `${config.LEARNER_RECORD.url}/record/${user.id}`,
	})

	const courses = []
	for (const record of response.data.records) {
		const activityId = record.activityId
		const course = await catalog.get(activityId) // convert to courseId
		if (!course) {
			logger.warn(
				`LRS data for course that doesn't exist. User ID: ${
					user.id
				}, course URI: ${activityId}`
			)
			continue
		}
		// TODO: turn around
		course.record = record
		courses.push(course)
	}
	return courses
}

async function getCourseRecord(user: model.User, course: model.Course) {
	const response = await axios({
		method: 'get',
		params: {
			activityId: `${config.XAPI.activityBaseUri}/${course.uid}`,
		},
		url: `${config.LEARNER_RECORD.url}/record/${user.id}`,
	})

	return response.data

	// return {
	// 	completionDate,
	// 	result,
	// 	state,
	// }
}
