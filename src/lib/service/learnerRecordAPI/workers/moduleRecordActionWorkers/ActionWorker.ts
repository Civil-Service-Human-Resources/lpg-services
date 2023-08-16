import {CourseRecord} from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {CourseRecordInput} from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecordInput'
import {WorkerType} from 'lib/service/learnerRecordAPI/workers/workerType'
import {getLogger} from '../../../../logger'
import {Course, Module, User} from '../../../../model'
import {createCourseRecord, getCourseRecord} from '../../courseRecord/client'
import {RecordState} from '../../models/record'
import * as moduleRecordClient from '../../moduleRecord/client'
import {ModuleRecord} from '../../moduleRecord/models/moduleRecord'
import {ModuleRecordInput} from '../../moduleRecord/models/moduleRecordInput'

const logger = getLogger('LearnerRecordAPI/workers/ActionWorker')

export abstract class ActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User, protected readonly module: Module) { }

	abstract createModuleRecord(): Promise<ModuleRecord>

	abstract updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord>

	abstract updateCourseRecord(courseRecord: CourseRecord): Promise<void>

	async applyActionToLearnerRecord() {
		try {
			const courseRecord = await getCourseRecord(this.course.id, this.user)
			logger.debug(`Applying action ${this.getType().toString()} to module ${this.module.id} ` +
			`for course ${this.course.id} and user ${this.user.id}`)
			if (!courseRecord) {
				logger.debug(`Creating course record`)
				await this.createCourseRecord()
			} else {
				let moduleRecord = courseRecord.getModuleRecord(this.module.id)
				if (!moduleRecord) {
					logger.debug(`Creating module record`)
					moduleRecord = await this.createModuleRecord()
				} else {
					logger.debug(`Updating module record`)
					moduleRecord = await this.updateModuleRecord(moduleRecord)
				}
				courseRecord.upsertModuleRecord(moduleRecord.id, moduleRecord)
				logger.debug(`Updating course record`)
				await this.updateCourseRecord(courseRecord)
			}
		} catch (e) {
			logger.error(`Failed to apply action to the course record. UserID: ${this.user.id}, ` +
			`CourseID: ${this.course.id}, ModuleID: ${this.module.id}, with action ${this.getType()}. Error: ${e}`)
		}
	}

	createNewModuleRecord = async (state: RecordState) => {
		const input = this.generateModuleRecordInput(state)
		return await moduleRecordClient.createModuleRecord(input, this.user)
	}

	protected createNewCourseRecord = async (
		moduleRecords: ModuleRecordInput[],
		state?: RecordState,
		preference?: string
	) => {
		const input = new CourseRecordInput(
			this.course.id,
			this.course.title,
			this.user.id,
			this.course.isRequired(),
			moduleRecords,
			state,
			preference
		)
		await createCourseRecord(input, this.user)
	}

	protected generateModuleRecordInput(state: RecordState) {
		return new ModuleRecordInput(
			this.user.id,
			this.course.id,
			this.module.id,
			this.module.title,
			this.module.optional,
			this.module.type,
			this.module.duration,
			state,
			this.module.cost
		)
	}
	protected abstract createCourseRecord(): Promise<void>
	protected abstract getType(): WorkerType
}
