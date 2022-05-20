import {Course, Module, User} from '../../../../model'
import {RecordState} from '../../models/record'

export class ModuleRecordInput {
	constructor(
		readonly userId: string,
		readonly courseId: string,
		readonly moduleId: string,
		readonly moduleTitle: string,
		readonly optional: boolean,
		readonly moduleType: string,
		readonly duration: number,
		readonly state?: string,
		readonly cost?: number
	) {}
}

export function createCompletedModuleRecord(courseData: Course, user: User, module: Module) {
	return new ModuleRecordInput(
		user.id,
		courseData.id,
		module.id,
		module.title,
		module.optional,
		module.type,
		module.duration,
		RecordState.Completed
	)
}

export function createInProgressModuleRecord(courseData: Course, user: User, module: Module) {
	return new ModuleRecordInput(
		user.id,
		courseData.id,
		module.id,
		module.title,
		module.optional,
		module.type,
		module.duration,
		RecordState.InProgress
	)
}
