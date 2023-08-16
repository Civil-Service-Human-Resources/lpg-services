import {Course, Module, User} from 'lib/model'
import {patchCourseRecord} from '../../../learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../../../learnerRecordAPI/courseRecord/models/courseRecord'
import {setState} from '../../../learnerRecordAPI/courseRecord/patchFactory'
import {RecordState} from '../../../learnerRecordAPI/models/record'
import {patchModuleRecord} from '../../../learnerRecordAPI/moduleRecord/client'
import {ModuleRecord} from '../../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {setCompletionDate} from '../../../learnerRecordAPI/moduleRecord/patchFactory'
import {WorkerType} from '../workerType'
import {ActionWorker} from './ActionWorker'

export class CompletedActionWorker extends ActionWorker {
	constructor(readonly course: Course, readonly user: User, readonly module: Module) {
		super(course, user, module)
	}

	async createCourseRecord() {
		const moduleRecordInput = this.generateModuleRecordInput(RecordState.Completed)
		let courseRecordState = RecordState.InProgress
		if (this.course.modules.length === 1) {
			courseRecordState = RecordState.Completed
		} else {
			if (this.course.getRequiredModules().length === 1 && !this.module.optional) {
				courseRecordState = RecordState.Completed
			}
		}
		await this.createNewCourseRecord([moduleRecordInput], courseRecordState)
	}

	async createModuleRecord() {
		return await this.createNewModuleRecord(RecordState.Completed)
	}

	async updateCourseRecord(courseRecord: CourseRecord) {
		if (courseRecord.areAllRelevantModulesComplete(this.course.modules)) {
			await patchCourseRecord([setState(RecordState.Completed)], this.user, this.course.id)
		} else if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
			await patchCourseRecord([setState(RecordState.InProgress)], this.user, this.course.id)
		}
	}

	async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = [setState(RecordState.Completed), setCompletionDate(new Date())]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}

	protected getType(): WorkerType {
		return WorkerType.COMPLETE_MODULE
	}
}
