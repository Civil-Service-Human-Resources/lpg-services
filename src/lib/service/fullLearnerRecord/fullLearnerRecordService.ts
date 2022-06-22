import {Course, User} from '../../model'
import {
	completeCourseRecord,
	createCourseRecord,
	getCourseRecord,
	updateLastUpdated
} from '../learnerRecordAPI/courseRecord/client'
import {RecordState} from '../learnerRecordAPI/models/record'
import {
	completeModuleRecord,
	createModuleRecord,
	initialiseModuleRecord,
	updateModuleRecordUpdatedAt,
} from '../learnerRecordAPI/moduleRecord/client'
import {FullCourseRecord} from './fullCourseRecord'
import {FullModuleRecord} from './fullModuleRecord'

const createNewCourseRecord = async (courseRecord: FullCourseRecord, moduleRecord: FullModuleRecord, user: User) => {
	const courseRecordAsInput = courseRecord.getAsCourseRecordInput()
	courseRecordAsInput.moduleRecords.push(moduleRecord.getAsModuleRecordInput())
	await createCourseRecord(courseRecordAsInput, user)
}

const createNewModuleRecord = async (moduleRecord: FullModuleRecord, user: User) => {
	const moduleRecordAsInput = moduleRecord.getAsModuleRecordInput()
	await createModuleRecord(moduleRecordAsInput, user)
}

// Implement a redis cache for this later on to avoid going to learner record API every time
const getFullCourseRecord = async (course: Course, user: User) => {
	const courseRecord = await getCourseRecord(course.id, user)
	return new FullCourseRecord(course, user.id, courseRecord)
}

export const progressModule = async (course: Course, moduleId: string, user: User) => {
	const fullRecord = await getFullCourseRecord(course, user)
	const moduleRecord = fullRecord.fetchModule(moduleId)
	if (!fullRecord.isStarted()) {
		moduleRecord.state = RecordState.InProgress
		fullRecord.state = RecordState.InProgress
		await createNewCourseRecord(fullRecord, moduleRecord, user)
	} else {
		if (!moduleRecord.isCompleted()) {
			if (!moduleRecord.isStarted()) {
				moduleRecord.state = RecordState.InProgress
				await createNewModuleRecord(moduleRecord, user)
			} else {
				await initialiseModuleRecord(moduleRecord.id!, user)
			}
		} else {
			await updateModuleRecordUpdatedAt(moduleRecord.id!, user)
		}
		await updateLastUpdated(fullRecord.courseId, user)
	}
}

export const completeModule = async (course: Course, moduleId: string, user: User) => {
	const fullRecord = await getFullCourseRecord(course, user)
	const moduleRecord = fullRecord.fetchModule(moduleId)
	if (!fullRecord.isStarted()) {
		moduleRecord.state = RecordState.Completed
		fullRecord.state = fullRecord.modules.size === 1 ? RecordState.Completed : RecordState.InProgress
		await createNewCourseRecord(fullRecord, moduleRecord, user)
	} else {
		if (!moduleRecord.isStarted()) {
			moduleRecord.state = RecordState.Completed
			await createNewModuleRecord(moduleRecord, user)
		} else {
			await completeModuleRecord(moduleRecord.id!, user)
		}
		fullRecord.updateModule(moduleRecord.moduleId, moduleRecord)

		if (fullRecord.areAllRequiredModulesComplete()) {
			await completeCourseRecord(fullRecord.courseId, user)
		} else {
			await updateLastUpdated(fullRecord.courseId, user)
		}
	}
}
