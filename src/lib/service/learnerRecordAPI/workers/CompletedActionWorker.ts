import { Course, Module, User } from '../../../model'
import { patchCourseRecord } from '../../learnerRecordAPI/courseRecord/client'
import { CourseRecord } from '../../learnerRecordAPI/courseRecord/models/courseRecord'
import { setLastUpdated, setState } from '../../learnerRecordAPI/courseRecord/patchFactory'
import { RecordState } from '../../learnerRecordAPI/models/record'
import { patchModuleRecord } from '../../learnerRecordAPI/moduleRecord/client'
import { ModuleRecord } from '../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import { setCompletionDate, setUpdatedAt } from '../../learnerRecordAPI/moduleRecord/patchFactory'
import { ActionWorker } from './ActionWorker'

export class CompletedActionWorker extends ActionWorker {
	constructor(readonly course: Course, readonly user: User, readonly module: Module) {
		super(course, user, module)
	}

	async createCourseRecord() {
		const moduleRecordInput = this.generateModuleRecordInput(RecordState.Completed)
		const courseRecordState = this.course.modules.length === 1 ? RecordState.Completed : RecordState.InProgress
		await this.createNewCourseRecord([moduleRecordInput], courseRecordState)
	}

	async createModuleRecord() {
		return await this.createNewModuleRecord(RecordState.Completed)
	}

	async updateCourseRecord(courseRecord: CourseRecord) {
		const patches = [setLastUpdated()]
		if (courseRecord.areAllRequiredModulesComplete(this.course.modules)) {
			patches.push(setState(RecordState.Completed))
		} else if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
			patches.push(setState(RecordState.InProgress))
		}
		await patchCourseRecord(patches, this.user, this.course.id)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = [setUpdatedAt(), setState(RecordState.Completed), setCompletionDate(new Date())]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}
}
