import { getLogger } from '../../../../logger'
import { Course, Module, User } from '../../../../model'
import { getCourseRecord } from '../../courseRecord/client'
import { RecordState } from '../../models/record'
import * as moduleRecordClient from '../../moduleRecord/client'
import { ModuleRecord } from '../../moduleRecord/models/moduleRecord'
import { ModuleRecordInput } from '../../moduleRecord/models/moduleRecordInput'
import { CourseRecordActionWorker } from '../courseRecordActionWorkers/CourseRecordActionWorker'

const logger = getLogger('LearnerRecordAPI/workers/ActionWorker')

export abstract class ActionWorker extends CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User, protected readonly module: Module) {
		super(course, user)
	}

	abstract createModuleRecord(): Promise<ModuleRecord>

	abstract updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord>

	async applyActionToLearnerRecord() {
		try {
			const courseRecord = await getCourseRecord(this.course.id, this.user)
			logger.debug(`LC-1627: ActionWorker.ts.applyActionToLearnerRecord: Applying action ${this.getType().toString()} ` +
				`to module ${this.module.id} for course ${this.course.id} and user ${this.user.id}`)
			if (!courseRecord) {
				logger.debug(`LC-1627: ActionWorker.ts.Creating course record`)
				await this.createCourseRecord()
			} else {
				let moduleRecord = courseRecord.getModuleRecord(this.module.id)
				if (!moduleRecord) {
					logger.debug(`LC-1627: ActionWorker.ts.Creating module record`)
					moduleRecord = await this.createModuleRecord()
				} else {
					logger.debug(`LC-1627: ActionWorker.ts.Updating module record`)
					moduleRecord = await this.updateModuleRecord(moduleRecord)
				}
				courseRecord.upsertModuleRecord(moduleRecord.id, moduleRecord)
				logger.debug(`LC-1627: ActionWorker.ts.Updating course record`)
				await this.updateCourseRecord(courseRecord)
			}
		} catch (e) {
			logger.error(`LC-1627: ActionWorker.ts.Failed to apply action to the course record. UserID: ${this.user.id}, ` +
			`CourseID: ${this.course.id}, ModuleID: ${this.module.id}, with action ${this.getType()}. Error: ${e}`)
		}
	}

	createNewModuleRecord = async (state: RecordState) => {
		const input = this.generateModuleRecordInput(state)
		return await moduleRecordClient.createModuleRecord(input, this.user)
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
}
