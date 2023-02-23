import { getLogger } from '../../../../logger'
import { Course, User } from '../../../../model'
import { createCourseRecord, patchCourseRecord } from '../../courseRecord/client'
import { CourseRecord } from '../../courseRecord/models/courseRecord'
import { CourseRecordInput } from '../../courseRecord/models/courseRecordInput'
import { setLastUpdated } from '../../courseRecord/patchFactory'
import { getCourseRecord, setCourseRecord } from '../../courseRecord/service'
import { RecordState } from '../../models/record'
import { ModuleRecordInput } from '../../moduleRecord/models/moduleRecordInput'
import { WorkerType } from '../workerType'

const logger = getLogger('LearnerRecordAPI/workers/CourseRecordActionWorker')

/**
 * Generic worker class for when JUST the course record needs updating
 */
export abstract class CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User) {}

	async applyActionToLearnerRecord() {
		try {
			logger.debug(`Applying action to for course ${this.course.id} and user ${this.user.id}`)
			let courseRecord = await getCourseRecord(this.course.id, this.user)
			if (!courseRecord) {
				logger.debug(`Creating course record`)
				courseRecord = await this.createCourseRecord()
			} else {
				logger.debug(`Updating course record`)
				courseRecord = await this.updateCourseRecord(courseRecord)
			}
			setCourseRecord(courseRecord.courseId, this.user, courseRecord)
		} catch (e) {
			logger.error(
				`Failed to apply action to the course record. UserID: ${this.user.id}, ` +
					`CourseID: ${this.course.id}, with action ${this.getType()}. Error: ${e}`
			)
		}
	}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<CourseRecord> {
		return await patchCourseRecord([setLastUpdated(new Date())], this.user, courseRecord.courseId)
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
		return await createCourseRecord(input, this.user)
	}

	protected abstract createCourseRecord(): Promise<CourseRecord>
	protected abstract getType(): WorkerType
}
