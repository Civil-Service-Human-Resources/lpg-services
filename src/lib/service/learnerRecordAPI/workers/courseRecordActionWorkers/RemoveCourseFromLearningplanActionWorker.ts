import { getLogger } from '../../../../logger'
import { Course, User } from '../../../../model'
import { patchCourseRecord } from '../../courseRecord/client'
import { CourseRecord } from '../../courseRecord/models/courseRecord'
import { setLastUpdated, setState } from '../../courseRecord/patchFactory'
import { RecordState } from '../../models/record'
import { WorkerType } from '../workerType'
import { CourseRecordActionWorker } from './CourseRecordActionWorker'

const logger = getLogger('fullLearnerRecord/workers/RemoveCourseFromLearningplanActionWorker')

export class RemoveCourseFromLearningplanActionWorker extends CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User) {
		super(course, user)
	}

	async updateCourseRecord(courseRecord: CourseRecord) {
		if (!courseRecord.hasBeenAddedToLearningPlan()) {
			const patches = [setState(RecordState.Archived), setLastUpdated(new Date())]
			patchCourseRecord(patches, this.user, courseRecord.courseId)
		}
	}

	async createCourseRecord() {
		logger.warn(
			`Attempted removal from learning plan when no course record exists
			(course: ${this.course.id}, user: ${this.user.id})`
		)
		this.createNewCourseRecord([], RecordState.Archived)
	}

	protected getType(): WorkerType {
		return WorkerType.REMOVE_FROM_LEARNING_PLAN
	}
}
