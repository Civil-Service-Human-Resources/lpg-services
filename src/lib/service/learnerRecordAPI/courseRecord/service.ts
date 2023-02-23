import { getLogger } from '../../../logger'
import {User} from '../../../model'
import {CourseRecordCache} from './cache'
import * as courseRecordClient from './client'
import {CourseRecord} from './models/courseRecord'

const logger = getLogger('LearnerRecordAPI/workers/CourseRecordActionWorker')

let courseRecordCache: CourseRecordCache

export function setCaches(crCache: CourseRecordCache) {
	courseRecordCache = crCache
}

export async function getCourseRecord(courseId: string, user: User): Promise<CourseRecord | undefined> {
	const cacheId = `${user.id}:${courseId}`
	let courseRecord = await courseRecordCache.get(cacheId)
	if (!courseRecord) {
		logger.debug(`Cache miss with ID '${cacheId}', getting record from API`)
		courseRecord = await courseRecordClient.getCourseRecord(courseId, user)
		if (courseRecord) {
			await courseRecordCache.set(cacheId, courseRecord)
		}
	}
	return courseRecord
}

export async function setCourseRecord(courseId: string, user: User, courseRecord: CourseRecord) {
	const cacheId = `${user.id}:${courseId}`
	await courseRecordCache.set(cacheId, courseRecord)
}
