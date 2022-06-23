import {Course, User} from '../../model'
import * as courseRecordClient from './courseRecord/client'
import {CourseRecordInput} from './courseRecord/models/courseRecordInput'
import * as moduleRecordClient from './moduleRecord/client'

export async function addCourseToLearningPlan(course: Course, user: User) {
	const courseRecord = await courseRecordClient.getCourseRecord(course.id, user)
	if (!courseRecord) {
		const input = new CourseRecordInput(
			course.id,
			course.title,
			user.userId,
			course.isRequired(),
			[],
			undefined,
			'LIKED'
		)
		await courseRecordClient.createCourseRecord(input, user)
	}
}

export async function removeCourseFromSuggestions(course: Course, user: User) {
	const courseRecord = await courseRecordClient.getCourseRecord(course.id, user)
	if (!courseRecord) {
		const input = new CourseRecordInput(
			course.id,
			course.title,
			user.userId,
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