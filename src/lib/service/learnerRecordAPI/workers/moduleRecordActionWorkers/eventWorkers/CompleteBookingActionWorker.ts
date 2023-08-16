import {CourseRecordStateError} from '../../../../../exception/courseRecordStateError'
import {Course, Event, Module, User} from '../../../../../model'
import {patchCourseRecord} from '../../../courseRecord/client'
import {CourseRecord} from '../../../courseRecord/models/courseRecord'
import {setState} from '../../../courseRecord/patchFactory'
import {RecordState} from '../../../models/record'
import {patchModuleRecord} from '../../../moduleRecord/client'
import {ModuleRecord} from '../../../moduleRecord/models/moduleRecord'
import {setCompletionDate} from '../../../moduleRecord/patchFactory'
import {WorkerType} from '../../workerType'
import {EventActionWorker} from './EventActionWorker'

export class CompleteBookingActionWorker extends EventActionWorker {
	constructor(
		protected readonly course: Course,
		protected readonly user: User,
		protected readonly event: Event,
		protected readonly module: Module
	) {
		super(course, user, event, module)
	}

	async createCourseRecord(): Promise<void> {
		const msg = `User ${this.user.id} attempted to record
        attendance against event ${this.event.id} but course record
        does not exist (course ${this.course.id}, module ${this.module.id})`
		throw new CourseRecordStateError(msg)
	}

	async createModuleRecord(): Promise<ModuleRecord> {
		const msg = `User ${this.user.id} attempted to record
        attendance against event ${this.event.id} but module record
        does not exist (course ${this.course.id}, module ${this.module.id})`
		throw new CourseRecordStateError(msg)
	}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
		if (courseRecord.areAllRelevantModulesComplete(this.course.modules)) {
			await patchCourseRecord([setState(RecordState.Completed)], this.user, this.course.id)
		} else if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
			await patchCourseRecord([setState(RecordState.InProgress)], this.user, this.course.id)
		}
	}

	async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
		// Only approved event modules can have attendance registered against them
		if (moduleRecord.isApproved()) {
			const patches = [setState(RecordState.Completed), setCompletionDate(new Date())]
			return await patchModuleRecord(patches, this.user, moduleRecord.id)
		} else {
			const msg = `User ${this.user.id} attempted to record
            attendance against event ${this.event.id} but module record
            has not been approved (course ${this.course.id}, module ${this.module.id})`
			throw new CourseRecordStateError(msg)
		}
	}

	protected getType(): WorkerType {
		return WorkerType.COMPLETE_BOOKING
	}
}
