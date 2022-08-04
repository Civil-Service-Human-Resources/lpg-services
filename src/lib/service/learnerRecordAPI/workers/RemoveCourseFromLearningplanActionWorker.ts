import { getLogger } from '../../../logger'
import { Course, User } from '../../../model'
import { CourseRecord } from '../../learnerRecordAPI/courseRecord/models/courseRecord'
import { setLastUpdated, setState } from '../../learnerRecordAPI/courseRecord/patchFactory'
import { RecordState } from '../../learnerRecordAPI/models/record'
import { CourseRecordActionWorker } from './CourseRecordActionWorker'

const logger = getLogger('fullLearnerRecord/workers/RemoveCourseFromLearningplanActionWorker')

export class RemoveCourseFromLearningplanActionWorker extends CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User) {
		super(course, user)
	}

	async updateCourseRecord(courseRecord: CourseRecord) {
		if (!courseRecord.hasBeenAddedToLearningPlan()) {
			const patches = []
			patches.push(...[setState(RecordState.Archived), setLastUpdated(new Date())])
		}
	}

	async createCourseRecord() {
		logger.warn(
			`Attempted removal from learning plan when no course record exists
			(course: ${this.course.id}, user: ${this.user.id})`
		)
	}
}
