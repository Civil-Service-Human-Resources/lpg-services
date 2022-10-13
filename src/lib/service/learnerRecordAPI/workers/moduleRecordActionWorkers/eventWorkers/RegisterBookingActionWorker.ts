import {Course, Event, Module, User} from '../../../../../model'
import {patchCourseRecord} from '../../../../learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../../../../learnerRecordAPI/courseRecord/models/courseRecord'
import {setLastUpdated} from '../../../../learnerRecordAPI/courseRecord/patchFactory'
import {RecordState} from '../../../../learnerRecordAPI/models/record'
import {patchModuleRecord} from '../../../../learnerRecordAPI/moduleRecord/client'
import {ModuleRecord} from '../../../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {
	clearCompletionDate,
	clearResult,
	clearScore,
	setEventDate,
	setEventId,
	setState,
	setUpdatedAt,
} from '../../../../learnerRecordAPI/moduleRecord/patchFactory'
import {WorkerType} from '../../workerType'
import {EventActionWorker} from './EventActionWorker'

export class RegisterBookingActionWorker extends EventActionWorker {
	constructor(
		protected readonly course: Course,
		protected readonly user: User,
		protected readonly event: Event,
		protected readonly module: Module
	) {
		super(course, user, event, module)
	}

	async createCourseRecord(): Promise<void> {
		const modules = [this.generateModuleRecordInput(RecordState.Registered)]
		await this.createNewCourseRecord(modules, RecordState.Registered)
	}

	async createModuleRecord(): Promise<ModuleRecord> {
		return await this.createNewModuleRecord(RecordState.Registered)
	}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
		const patches = [setLastUpdated(new Date())]
		if (courseRecord.isNull() || !courseRecord.isInProgress()) {
			patches.push(setState(RecordState.Registered))
		}
		await patchCourseRecord(patches, this.user, courseRecord.courseId)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
		const patches = [
			setState(RecordState.Registered),
			clearResult(),
			clearScore(),
			clearCompletionDate(),
			setEventId(this.event.id),
			setEventDate(this.event.startDate),
			setUpdatedAt(new Date()),
		]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}

	protected getType(): WorkerType {
		return WorkerType.REGISTER_BOOKING
	}
}
