import { Course, User } from '../../../../model'
import { patchCourseRecord } from '../../courseRecord/client'
import { CourseRecord, CourseRecordPreference } from '../../courseRecord/models/courseRecord'
import { clearState, setLastUpdated, setPreference } from '../../courseRecord/patchFactory'
import { CourseRecordActionWorker } from './CourseRecordActionWorker'

export class AddCourseToLearningplanActionWorker extends CourseRecordActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User) {
		super(course, user)
	}

	async updateCourseRecord(courseRecord: CourseRecord) {
		const patches = [setPreference(CourseRecordPreference.Liked), clearState(), setLastUpdated(new Date())]
		await patchCourseRecord(patches, this.user, courseRecord.courseId)
	}

	async createCourseRecord() {
		await this.createNewCourseRecord([], undefined, CourseRecordPreference.Liked)
	}
}
