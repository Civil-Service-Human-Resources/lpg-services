import {plainToClass} from 'class-transformer'
import {getLogger} from '../../../logger'
import * as model from '../../../model'
import {client} from '../baseConfig'
import {CourseRecord, CourseRecordResponse} from './models/courseRecord'

const logger = getLogger('LearnerRecordAPI/client.ts')

const URL = '/course_records'

export async function getFullRecord(user: model.User): Promise<CourseRecord[]> {
	const resp = await client._get<CourseRecordResponse>(
		{
			params: {
				userIds: user.id,
			},
			url: URL,
		},
		user
	)
	const courseRecords = plainToClass(CourseRecordResponse, resp)
	return await Promise.all(courseRecords.courseRecords.map(c => plainToClass(CourseRecord, c)))
}

export async function getCourseRecords(courseIds: string[], user: model.User): Promise<CourseRecord[]> {
	const resp = await client.makeRequest<CourseRecordResponse>(
		{
			method: 'GET',
			params: {
				courseIds,
				userIds: user.id,
			},
			url: URL,
		},
		user
	)
	return plainToClass(CourseRecordResponse, resp).courseRecords
}

export async function getCourseRecord(courseId: string, user: model.User): Promise<CourseRecord | undefined> {
	const courseRecords = await getCourseRecords([courseId], user)
	let courseRecord
	if (courseRecords.length === 1) {
		courseRecord = plainToClass(CourseRecord, courseRecords[0])
	} else if (courseRecords.length > 1) {
		logger.warn(`Course record for course ID ${courseId} and user ID ${user.id} returned a result set greater than 1`)
		courseRecord = plainToClass(CourseRecord, courseRecords[0])
	}
	return courseRecord
}
