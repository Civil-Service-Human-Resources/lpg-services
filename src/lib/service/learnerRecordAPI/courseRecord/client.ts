import { plainToClass } from 'class-transformer'
import { getLogger } from 'lib/logger'

import * as model from '../../../model'
import { JsonPatch } from '../../shared/models/JsonPatch'
import { makeRequest, patch } from '../baseConfig'
import { ModuleRecord } from '../moduleRecord/models/moduleRecord'
import { CourseRecord, CourseRecordResponse } from './models/courseRecord'
import { CourseRecordInput } from './models/courseRecordInput'

const logger = getLogger('LearnerRecordAPI/client.ts')

const URL = '/course_records'

export async function patchCourseRecord(jsonPatch: JsonPatch[], user: model.User, courseId: string) {
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
		courseRecord = buildCourseRecord(courseRecords[0])
	} else if (courseRecords.length > 1) {
		logger.warn(`Course record for course ID ${courseId} and user ID ${user.id} returned a result set greater than 1`)
		courseRecord = buildCourseRecord(courseRecords[0])
	}
	return courseRecord
}

async function buildCourseRecord(courseRecordData: CourseRecord) {
	const courseRecord = plainToClass(CourseRecord, courseRecordData)
	courseRecord.modules = courseRecordData.modules = courseRecordData.modules.map(m => plainToClass(ModuleRecord, m))
	return courseRecord
}
