import { Course, Module, User } from '../../../model'
import { getCourseRecord } from '../../learnerRecordAPI/courseRecord/client'
import { RecordState } from '../../learnerRecordAPI/models/record'
import { createModuleRecord } from '../../learnerRecordAPI/moduleRecord/client'
import { ModuleRecord } from '../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import { ModuleRecordInput } from '../../learnerRecordAPI/moduleRecord/models/moduleRecordInput'
import { CourseRecordActionWorker } from './CourseRecordActionWorker'

export abstract class ActionWorker extends CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User, protected readonly module: Module) {
		super(course, user)
	}

	abstract createModuleRecord(): Promise<ModuleRecord>

	abstract updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord>

	async applyActionToLearnerRecord() {
		const courseRecord = await getCourseRecord(this.course.id, this.user)
		if (!courseRecord) {
			await this.createCourseRecord()
		} else {
			let moduleRecord = courseRecord.getModuleRecord(this.module.id)
			if (!moduleRecord) {
				moduleRecord = await this.createModuleRecord()
			} else {
				moduleRecord = await this.updateModuleRecord(moduleRecord)
			}
			courseRecord.updateModuleRecord(moduleRecord.id, moduleRecord)
			await this.updateCourseRecord(courseRecord)
		}
	}

	createNewModuleRecord = async (state: RecordState) => {
		const input = this.generateModuleRecordInput(state)
		return await createModuleRecord(input, this.user)
	}

	protected generateModuleRecordInput(state: RecordState) {
		return new ModuleRecordInput(
			this.user.userId,
			this.course.id,
			this.module.id,
			this.module.title,
			this.module.optional,
			this.module.type,
			this.module.duration,
			state,
			this.module.cost
		)
	}

}
