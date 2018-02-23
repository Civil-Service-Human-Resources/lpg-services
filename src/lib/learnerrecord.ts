import axios from 'axios'
import * as config from './config'
import * as catalog from './service/catalog'
import * as model from './model'
import * as log4js from 'log4js'

const logger = log4js.getLogger('learner-record')

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
		const courseId = activityId.match(/courses\/([^\/]+)/)[1]
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
		course.result = record.result
		course.score = record.score
		course.state = record.state
		courses.push(course)
	}
	return courses
}

export async function getCourseRecord(user: model.User, course: model.Course) {
	const response = await axios({
		method: 'get',
		params: {
			activityId: `${config.XAPI.activityBaseUri}/${course.uid}`,
		},
		url: `${config.LEARNER_RECORD.url}/record/${user.id}`,
	})
	if (response.data.records.length > 0) {
		const record = response.data.records[0]
		if (record.completionDate) {
			record.completionDate = new Date(record.completionDate)
		}
		return record
	}
	return null
}
