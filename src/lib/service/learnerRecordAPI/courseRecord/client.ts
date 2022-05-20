import {makeRequest, patch} from '../baseConfig'
import {CourseRecord, CourseRecordResponse} from './models/courseRecord'
import {CourseRecordInput} from './models/courseRecordInput'
import * as model from '../../../model'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {completeRecord} from '../models/patchFactory'

const URL = '/course_records'

export async function completeCourseRecord(courseId: string, user: model.User) {
	const jsonPatch = completeRecord()
	return await patchCourseRecord(jsonPatch, user, courseId)
}

async function patchCourseRecord(jsonPatch: JsonPatch[], user: model.User, courseId: string) {
	let response = await patch<CourseRecord>(
		{
			url: URL,
			data: jsonPatch,
			params: {
				courseId: courseId,
				userId: user.id,
			},
		},
		user
	)
	return response.data
}

export async function createCourseRecord(courseRecord: CourseRecordInput, user: model.User) {
	let response = await makeRequest<CourseRecord>(
		{
			method: 'POST',
			url: URL,
			data: courseRecord,
		},
		user
	)
	return response.data
}

export async function getCourseRecord(courseId: String, user: model.User) {
	let response = await makeRequest<CourseRecordResponse>(
		{
			method: 'GET',
			url: URL,
			params: {
				courseId: courseId,
				userId: user.id,
			},
		},
		user
	)
	let course_records = response.data.CourseRecords
	if (course_records.length == 1) {
		return course_records[0]
	} else {
		return undefined
	}
}
