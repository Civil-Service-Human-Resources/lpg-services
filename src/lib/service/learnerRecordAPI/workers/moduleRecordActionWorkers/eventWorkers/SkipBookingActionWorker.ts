import {CourseRecordStateError} from 'lib/exception/courseRecordStateError'
import {Course, Event, Module, User} from 'lib/model'
import {patchCourseRecord} from '../../../../learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../../../../learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from '../../../../learnerRecordAPI/models/record'
import {patchModuleRecord} from '../../../../learnerRecordAPI/moduleRecord/client'
import {ModuleRecord} from '../../../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {
	clearBookingStatus,
	clearCompletionDate,
	clearResult,
	clearScore,
	setState,
} from '../../../../learnerRecordAPI/moduleRecord/patchFactory'
import {WorkerType} from '../../workerType'
import {EventActionWorker} from './EventActionWorker'

export class SkipBookingActionWorker extends EventActionWorker {
	constructor(
		protected readonly course: Course,
		protected readonly user: User,
		protected readonly event: Event,
		protected readonly module: Module
	) {
		super(course, user, event, module)
	}

	async createCourseRecord(): Promise<void> {
		const msg = `User ${this.user.id} attempted to skip
        event ${this.event.id} but a course record does not exist
        (course ${this.course.id}, module ${this.module.id})`
		throw new CourseRecordStateError(msg)
	}

	async createModuleRecord(): Promise<ModuleRecord> {
		const msg = `User ${this.user.id} attempted to skip
        event ${this.event.id} but a module record
        does not exist (course ${this.course.id}, module ${this.module.id})`
		throw new CourseRecordStateError(msg)
	}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
		if (courseRecord.isRegistered()) {
			await patchCourseRecord([setState(RecordState.Skipped)], this.user, courseRecord.courseId)
		}
	}

	async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
		const patches = [
			setState(RecordState.Skipped),
			clearBookingStatus(),
			clearResult(),
			clearScore(),
			clearCompletionDate(),
		]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}

	protected getType(): WorkerType {
		return WorkerType.SKIP_BOOKING
	}
}
