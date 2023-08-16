import {Course, Module, User} from 'lib/model'
import {patchCourseRecord} from '../../courseRecord/client'
import {CourseRecord} from '../../courseRecord/models/courseRecord'
import {setState} from '../../courseRecord/patchFactory'
import {RecordState} from '../../models/record'
import {patchModuleRecord} from '../../moduleRecord/client'
import {ModuleRecord} from '../../moduleRecord/models/moduleRecord'
import {clearResult, clearScore} from '../../moduleRecord/patchFactory'
import {WorkerType} from '../workerType'
import {ActionWorker} from './ActionWorker'

export class InitialiseActionWorker extends ActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User, protected readonly module: Module) {
		super(course, user, module)
	}

	async createCourseRecord() {
		const moduleRecordInput = this.generateModuleRecordInput(RecordState.InProgress)
		await this.createNewCourseRecord([moduleRecordInput], RecordState.InProgress)
	}

	async createModuleRecord() {
		return await this.createNewModuleRecord(RecordState.InProgress)
	}

	async updateCourseRecord(courseRecord: CourseRecord) {
		if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
			await patchCourseRecord([setState(RecordState.InProgress)], this.user, this.course.id)
		}
	}

	async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = []
		if (!moduleRecord!.isCompleted()) {
			patches.push(
				...[
					setState(RecordState.InProgress),
					clearResult(),
					clearScore(),
				]
			)
		}
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}

	protected getType(): WorkerType {
		return WorkerType.INITIALISE_MODULE
	}
}
