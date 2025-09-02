import {Type} from 'class-transformer'
import {CacheableObject} from '../../../../../utils/cacheableObject'
import {RequiredLearningCourse} from './requiredLearningCourse'

export class RequiredLearning implements CacheableObject {
	getId(): string {
		return this.userId
	}
	public userId: string
	@Type(() => RequiredLearningCourse)
	public courses: RequiredLearningCourse[]
}
