import { getLogger } from 'lib/logger'
import * as model from '../../../model'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {makeRequest, patch} from '../baseConfig'
import {completeRecord} from '../models/patchFactory'
import {CourseRecord, CourseRecordResponse} from './models/courseRecord'
import {CourseRecordInput} from './models/courseRecordInput'

const logger = getLogger('LearnerRecordAPI/client.ts')

const URL = '/course_records'

export async function completeCourseRecord(courseId: string, user: model.User) {
	const jsonPatch = completeRecord()
	return await patchCourseRecord(jsonPatch, user, courseId)
}

async function patchCourseRecord(jsonPatch: JsonPatch[], user: model.User, courseId: string) {
	logger.debug(`Patching course record for course ID ${courseId} and user ID ${user.id}`)
	const response = await patch<CourseRecord>(
		{
			data: jsonPatch,
			params: {
				courseId,
				userId: user.id,
			},
			url: URL,
		},
		user
	)
	return response.data
}

export async function createCourseRecord(courseRecord: CourseRecordInput, user: model.User) {
	logger.debug(`Creating course record for course ID ${courseRecord.courseId} and user ID ${user.id}`)
	const response = await makeRequest<CourseRecord>(
		{
			data: courseRecord,
			method: 'POST',
			url: URL,
		},
		user
	)
	return response.data
}

export async function getCourseRecord(courseId: string, user: model.User): Promise<CourseRecord|undefined> {
	logger.debug(`Getting course record for course ID ${courseId} and user ID ${user.id}`)
	const response = await makeRequest<CourseRecordResponse>(
		{
			method: 'GET',
			params: {
				courseId,
				userId: user.id,
			},
			url: URL,
		},
		user
	)
	const courseRecords = response.data.courseRecords
	let courseRecord
	if (courseRecords.length === 1) {
		courseRecord = new CourseRecord(courseRecords[0])
	} else if (courseRecords.length > 1) {
		logger.warn(`Course record for course ID ${courseId} and user ID ${user.id} returned a result set greater than 1`)
		courseRecord = new CourseRecord(courseRecords[0])
	}
	return courseRecord
}
