import {Course, User} from '../../../../model'
import {createCourseRecord, getCourseRecord, patchCourseRecord} from '../../courseRecord/client'
import {CourseRecord} from '../../courseRecord/models/courseRecord'
import {CourseRecordInput} from '../../courseRecord/models/courseRecordInput'
import {setLastUpdated} from '../../courseRecord/patchFactory'
import {RecordState} from '../../models/record'
import {ModuleRecordInput} from '../../moduleRecord/models/moduleRecordInput'

/**
 * Generic worker class for when JUST the course record needs updating
 */
export abstract class CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User) {}

	async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
		await patchCourseRecord([setLastUpdated(new Date())], this.user, courseRecord.courseId)
	}

	async applyActionToLearnerRecord() {
		const courseRecord = await getCourseRecord(this.course.id, this.user)
		if (!courseRecord) {
			await this.createCourseRecord()
		} else {
			await this.updateCourseRecord(courseRecord)
		}
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
}
