import { plainToClass } from 'class-transformer'
import { getLogger } from 'lib/logger'

import * as model from '../../../model'
import { JsonPatch } from '../../shared/models/JsonPatch'
import { client } from '../baseConfig'
import { CourseRecord, CourseRecordResponse } from './models/courseRecord'
import { CourseRecordInput } from './models/courseRecordInput'

const logger = getLogger('LearnerRecordAPI/client.ts')

const URL = '/course_records'

export async function patchCourseRecord(jsonPatch: JsonPatch[], user: model.User, courseId: string) {
	const res =  await client.patch<CourseRecord>(
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
	const res =  await client.makeRequest<CourseRecord>(
		{
			data: courseRecord,
			method: 'POST',
			url: URL,
		},
		user
	)
	return plainToClass(CourseRecord, res)
}

export async function getFullRecord(user: model.User): Promise<CourseRecord[]> {
	const resp = await client._get<CourseRecordResponse>({
		params: {
			userId: user.id,
		},
		url: URL,
	}, user)
	const courseRecords = plainToClass(CourseRecordResponse, resp)
	return await Promise.all(courseRecords.courseRecords.map(c => plainToClass(CourseRecord, c)))
}

export async function getCourseRecord(courseId: string, user: model.User): Promise<CourseRecord|undefined> {
	const resp = await client.makeRequest<CourseRecordResponse>(
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
