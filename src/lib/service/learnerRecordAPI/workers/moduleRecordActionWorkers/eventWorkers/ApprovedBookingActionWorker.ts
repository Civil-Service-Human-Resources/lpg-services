import {Course, Event, Module, User} from '../../../../../model'
import {patchCourseRecord} from '../../../courseRecord/client'
import {CourseRecord} from '../../../courseRecord/models/courseRecord'
import {setLastUpdated, setState} from '../../../courseRecord/patchFactory'
import {RecordState} from '../../../models/record'
import {patchModuleRecord} from '../../../moduleRecord/client'
import {ModuleRecord} from '../../../moduleRecord/models/moduleRecord'
import {
	clearCompletionDate,
	clearResult,
	clearScore,
	setEventDate,
	setEventId,
	setUpdatedAt,
} from '../../../moduleRecord/patchFactory'
import {EventActionWorker} from './EventActionWorker'

export class ApprovedBookingActionWorker extends EventActionWorker {
	constructor(
		protected readonly course: Course,
		protected readonly user: User,
		protected readonly event: Event,
		protected readonly module: Module
	) {
		super(course, user, event, module)
	}

	async createCourseRecord(): Promise<void> {
		const modules = [this.generateModuleRecordInput(RecordState.Approved)]
		await this.createNewCourseRecord(modules, RecordState.Approved)
	}

	async createModuleRecord(): Promise<ModuleRecord> {
		return await this.createNewModuleRecord(RecordState.Approved)
	}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
		const patches = [setLastUpdated(new Date())]
		if (courseRecord.isNull() || !courseRecord.isInProgress()) {
			patches.push(setState(RecordState.Approved))
		}
		await patchCourseRecord(patches, this.user, courseRecord.courseId)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
		const patches = [
			setState(RecordState.Approved),
			clearResult(),
			clearScore(),
			clearCompletionDate(),
			setEventId(this.event.id),
			setEventDate(this.event.dateRanges[0]),
			setUpdatedAt(new Date()),
		]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}
}
