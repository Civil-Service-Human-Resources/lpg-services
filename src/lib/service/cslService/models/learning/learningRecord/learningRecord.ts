import {Type} from 'class-transformer'
import {CacheableObject} from '../../../../../utils/cacheableObject'
import {LearningRecordCourse} from './learningRecordCourse'
import {RequiredLearningRecord} from './requiredLearningRecord'

export class LearningRecord implements CacheableObject {
	getId(): string {
		return this.userId
	}

	public userId: string
	@Type(() => RequiredLearningRecord)
	public requiredLearningRecord: RequiredLearningRecord
	@Type(() => LearningRecordCourse)
	public otherLearning: LearningRecordCourse[]
}
