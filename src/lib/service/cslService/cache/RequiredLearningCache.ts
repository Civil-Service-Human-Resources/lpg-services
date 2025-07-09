import {plainToClass} from 'class-transformer'
import {CacheableObjectCache} from '../../../utils/cacheableObjectCache'
import {RequiredLearning} from '../models/learning/requiredLearning/requiredLearning'

export class RequiredLearningCache extends CacheableObjectCache<RequiredLearning> {
	getBaseKey(): string {
		return 'requiredLearning'
	}

	protected convert(cacheHit: string): RequiredLearning {
		return plainToClass(RequiredLearning, cacheHit)
	}

	public async clearForCourse(userId: string, courseId: string) {
		const requiredLearning = await this.get(userId)
		if (
			requiredLearning !== undefined &&
			requiredLearning.courses.find(course => course.id === courseId) !== undefined
		) {
			await this.delete(userId)
		}
	}
}
