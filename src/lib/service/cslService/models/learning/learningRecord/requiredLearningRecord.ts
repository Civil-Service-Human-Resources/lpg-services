import {Type} from 'class-transformer'
import {LearningRecordCourse} from './learningRecordCourse'

export class RequiredLearningRecord {
	@Type(() => LearningRecordCourse)
	public completedCourses: LearningRecordCourse[]
	public totalRequired: number

	public getRemainingCourses() {
		return this.totalRequired - this.completedCourses.length
	}
}
