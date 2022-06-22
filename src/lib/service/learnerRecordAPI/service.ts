import {Course, User} from '../../model'
import {createCourseRecord, getCourseRecord} from './courseRecord/client'
import {CourseRecordInput} from './courseRecord/models/courseRecordInput'

export async function addCourseToLearningPlan(course: Course, user: User) {
	const courseRecord = await getCourseRecord(course.id, user)
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
		await createCourseRecord(input, user)
	}
}

export async function removeCourseFromSuggestions(course: Course, user: User) {
	const courseRecord = await getCourseRecord(course.id, user)
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
		await createCourseRecord(input, user)
	}
}

export async function removeCourseFromLearningPlan(course: Course, user: User) {
	const courseRecord = await getCourseRecord(course.id, user)
	if (courseRecord) {
		await removeCourseFromLearningPlan(course, user)
	}
}
