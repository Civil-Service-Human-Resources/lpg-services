import {Course, Module, User} from '../../../../model'
import {patchCourseRecord} from '../../../learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../../../learnerRecordAPI/courseRecord/models/courseRecord'
import {setLastUpdated, setState} from '../../../learnerRecordAPI/courseRecord/patchFactory'
import {RecordState} from '../../../learnerRecordAPI/models/record'
import {patchModuleRecord} from '../../../learnerRecordAPI/moduleRecord/client'
import {ModuleRecord} from '../../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {setCompletionDate, setUpdatedAt} from '../../../learnerRecordAPI/moduleRecord/patchFactory'
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
		const patches = [setLastUpdated()]
		if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
			patches.push(setState(RecordState.InProgress))
		} else if (courseRecord.areAllRelevantModulesComplete(this.course.modules)) {
			patches.push(setState(RecordState.Completed))
		}
		await patchCourseRecord(patches, this.user, this.course.id)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = [setUpdatedAt(new Date()), setState(RecordState.Completed), setCompletionDate(new Date())]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}

	protected getType(): WorkerType {
		return WorkerType.COMPLETE_MODULE
	}
}
