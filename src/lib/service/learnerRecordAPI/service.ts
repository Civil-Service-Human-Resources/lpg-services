import { getLogger } from '../../logger'
import {Course, User} from '../../model'
import * as courseRecordClient from './courseRecord/client'
import {CourseRecordInput} from './courseRecord/models/courseRecordInput'
import * as moduleRecordClient from './moduleRecord/client'

const logger = getLogger('learnerRecordAPI/service')

export async function addCourseToLearningPlan(course: Course, user: User) {
	logger.debug(user.id)
	logger.debug(user.userId)
	const courseRecord = await courseRecordClient.getCourseRecord(course.id, user)
	if (!courseRecord) {
		const input = new CourseRecordInput(
			course.id,
			course.title,
			user.id,
			course.isRequired(),
			[],
			undefined,
			'LIKED'
		)
		await courseRecordClient.createCourseRecord(input, user)
	} else {
		await courseRecordClient.addCourseToLearningPlan(course.id, user)
	}
}

export async function removeCourseFromSuggestions(course: Course, user: User) {
	const courseRecord = await courseRecordClient.getCourseRecord(course.id, user)
	if (!courseRecord) {
		const input = new CourseRecordInput(
			course.id,
			course.title,
			user.id,
			course.isRequired(),
			[],
			undefined,
			'DISLIKED'
		)
		await courseRecordClient.createCourseRecord(input, user)
	}
}

export async function removeCourseFromLearningPlan(course: Course, user: User) {
	const courseRecord = await courseRecordClient.getCourseRecord(course.id, user)
	if (courseRecord && !courseRecord.isArchived()) {
		await courseRecordClient.removeCourseFromLearningPlan(course.id, user)
	}
}

export async function rateModule(course: Course, moduleId: string, user: User) {
	const courseRecord = await courseRecordClient.getCourseRecord(course.id, user)
	if (courseRecord) {
		const moduleRecord = courseRecord.getModuleRecord(moduleId)
		if (moduleRecord && !moduleRecord.rated) {
			await moduleRecordClient.rateModule(moduleRecord.id, user)
		}
	}
}
