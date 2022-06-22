import { plainToClass } from 'class-transformer'
import { getLogger } from 'lib/logger'
import * as model from '../../../model'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {makeRequest, patch} from '../baseConfig'
import {CourseRecord, CourseRecordResponse} from './models/courseRecord'
import {CourseRecordInput} from './models/courseRecordInput'
import { completeRecord, setLastUpdated } from './patchFactory'

const logger = getLogger('LearnerRecordAPI/client.ts')

const URL = '/course_records'

export async function completeCourseRecord(courseId: string, user: model.User) {
	const jsonPatch = completeRecord()
	return await patchCourseRecord(jsonPatch, user, courseId)
}

export async function updateLastUpdated(courseId: string, user: model.User) {
	const jsonPatch = setLastUpdated()
	return await patchCourseRecord(jsonPatch, user, courseId)
}

async function patchCourseRecord(jsonPatch: JsonPatch[], user: model.User, courseId: string) {
	logger.debug(`Patching course record for course ID ${courseId} and user ID ${user.id}`)
	const res =  await patch<CourseRecord>(
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
	return plainToClass(CourseRecord, res)
}

export async function createCourseRecord(courseRecord: CourseRecordInput, user: model.User) {
	logger.debug(`Creating course record for course ID ${courseRecord.courseId} and user ID ${user.id}`)
	const res =  await makeRequest<CourseRecord>(
		{
			data: courseRecord,
			method: 'POST',
			url: URL,
		},
		user
	)
	return plainToClass(CourseRecord, res)
}

export async function getCourseRecord(courseId: string, user: model.User): Promise<CourseRecord|undefined> {
	logger.debug(`Getting course record for course ID ${courseId} and user ID ${user.id}`)
	const resp = await makeRequest<CourseRecordResponse>(
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
	const courseRecords = plainToClass(CourseRecordResponse, resp).courseRecords
	let courseRecord
	if (courseRecords.length === 1) {
		courseRecord = plainToClass(CourseRecord, courseRecords[0])
	} else if (courseRecords.length > 1) {
		logger.warn(`Course record for course ID ${courseId} and user ID ${user.id} returned a result set greater than 1`)
		courseRecord = plainToClass(CourseRecord, courseRecords[0])
	}
	return courseRecord
}
