import {getLogger} from '../../../../logger'
import {Course, User} from '../../../../model'
import {createCourseRecord, getCourseRecord, patchCourseRecord} from '../../courseRecord/client'
import {CourseRecord} from '../../courseRecord/models/courseRecord'
import {CourseRecordInput} from '../../courseRecord/models/courseRecordInput'
import {setLastUpdated} from '../../courseRecord/patchFactory'
import {RecordState} from '../../models/record'
import {ModuleRecordInput} from '../../moduleRecord/models/moduleRecordInput'
import {WorkerType} from '../workerType'

const logger = getLogger('LearnerRecordAPI/workers/CourseRecordActionWorker')

/**
 * Generic worker class for when JUST the course record needs updating
 */
export abstract class CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User) {}

	async applyActionToLearnerRecord() {
		try {
			logger.debug(`Applying action to for course ${this.course.id} and user ${this.user.id}`)
			const courseRecord = await getCourseRecord(this.course.id, this.user)
			if (!courseRecord) {
				logger.debug(`Creating course record`)
				await this.createCourseRecord()
			} else {
				logger.debug(`Updating course record`)
				await this.updateCourseRecord(courseRecord)
			}
		} catch (e) {
			logger.error(
				`Failed to apply action to the course record. UserID: ${this.user.id}, ` +
					`CourseID: ${this.course.id}, with action ${this.getType()}. Error: ${e}`
			)
		}
	}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
		await patchCourseRecord([setLastUpdated(new Date())], this.user, courseRecord.courseId)
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

	protected abstract createCourseRecord(): Promise<void>
	protected abstract getType(): WorkerType
}
