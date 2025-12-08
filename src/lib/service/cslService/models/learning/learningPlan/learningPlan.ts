import {Type} from 'class-transformer'
import {CacheableObject} from '../../../../../utils/cacheableObject'
import {BookedLearningPlanCourse} from './bookedLearningPlanCourse'
import {LearningPlanCourse} from './learningPlanCourse'

export class LearningPlan implements CacheableObject {
	getId(): string {
		return this.userId
	}
	public userId: string
	@Type(() => BookedLearningPlanCourse)
	public bookedCourses: BookedLearningPlanCourse[] = []
	@Type(() => LearningPlanCourse)
	public learningPlanCourses: LearningPlanCourse[] = []

	public getCourseIds() {
		return this.getAllCourses().map(c => c.id)
	}

	public getAllCourses() {
		return [...this.bookedCourses, ...this.learningPlanCourses]
	}
}
