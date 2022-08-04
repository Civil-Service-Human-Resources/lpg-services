import { Course, Module, User } from '../../../model'
import { patchCourseRecord } from '../../learnerRecordAPI/courseRecord/client'
import { CourseRecord } from '../../learnerRecordAPI/courseRecord/models/courseRecord'
import { setLastUpdated, setState } from '../../learnerRecordAPI/courseRecord/patchFactory'
import { RecordState } from '../../learnerRecordAPI/models/record'
import { patchModuleRecord } from '../../learnerRecordAPI/moduleRecord/client'
import { ModuleRecord } from '../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {
	setCompletionDate, setResult, setScore, setUpdatedAt
} from '../../learnerRecordAPI/moduleRecord/patchFactory'
import { ActionWorker } from './ActionWorker'

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
		const patches = []
		patches.push(setLastUpdated())
		if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
			patches.push(setState(RecordState.InProgress))
		}
		await patchCourseRecord(patches, this.user, this.course.id)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = []
		if (!moduleRecord!.isCompleted()) {
			patches.push(
				...[
					setState(RecordState.InProgress),
					setResult(undefined),
					setScore(undefined),
					setCompletionDate(),
					setUpdatedAt(new Date()),
				]
			)
		}
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}
}
