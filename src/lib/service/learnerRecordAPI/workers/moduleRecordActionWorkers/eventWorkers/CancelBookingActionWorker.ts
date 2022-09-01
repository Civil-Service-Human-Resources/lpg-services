import {Course, Event, Module, User} from '../../../../../model'
import {patchCourseRecord} from '../../../courseRecord/client'
import {CourseRecord} from '../../../courseRecord/models/courseRecord'
import {setLastUpdated, setState} from '../../../courseRecord/patchFactory'
import {RecordState} from '../../../models/record'
import {patchModuleRecord} from '../../../moduleRecord/client'
import {BookingStatus, ModuleRecord} from '../../../moduleRecord/models/moduleRecord'
import {
	clearCompletionDate,
	clearResult,
	clearScore,
	setBookingStatus,
	setUpdatedAt,
} from '../../../moduleRecord/patchFactory'
import {EventActionWorker} from './EventActionWorker'

export class CancelBookingActionWorker extends EventActionWorker {
	constructor(
		protected readonly course: Course,
		protected readonly user: User,
		protected readonly event: Event,
		protected readonly module: Module
	) {
		super(course, user, event, module)
	}

	async createCourseRecord(): Promise<void> {
		const modRecord = this.generateModuleRecordInput(RecordState.Unregsitered)
		await this.createNewCourseRecord([modRecord], RecordState.Unregsitered)
	}

	async createModuleRecord(): Promise<ModuleRecord> {
		return await this.createNewModuleRecord(RecordState.Unregsitered)
	}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
		const patches = [setLastUpdated(new Date())]
		if (courseRecord.isNull() || !courseRecord.isInProgress()) {
			patches.push(setState(RecordState.Unregsitered))
		}
		await patchCourseRecord(patches, this.user, courseRecord.courseId)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
		const patches = [
			setState(RecordState.Unregsitered),
			clearResult(),
			clearScore(),
			clearCompletionDate(),
			setUpdatedAt(new Date()),
			setBookingStatus(BookingStatus.CANCELLED),
		]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}
}
