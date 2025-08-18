import {plainToClass} from 'class-transformer'
import {CacheableObjectCache} from '../../../utils/cacheableObjectCache'
import {LearningPlan} from '../models/learning/learningPlan/learningPlan'

export class LearningPlanCache extends CacheableObjectCache<LearningPlan> {
	getBaseKey(): string {
		return 'learningPlan'
	}

	protected convert(cacheHit: string): LearningPlan {
		return plainToClass(LearningPlan, cacheHit)
	}

	public async clearForCourse(userId: string, courseId: string) {
		const learningPlan = await this.get(userId)
		if (learningPlan !== undefined && learningPlan.getCourseIds().find(id => id === courseId) !== undefined) {
			await this.delete(userId)
		}
	}
}
