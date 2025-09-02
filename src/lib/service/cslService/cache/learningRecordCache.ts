import {plainToClass} from 'class-transformer'
import {CacheableObjectCache} from '../../../utils/cacheableObjectCache'
import {LearningRecord} from '../models/learning/learningRecord/learningRecord'

export class LearningRecordCache extends CacheableObjectCache<LearningRecord> {
	getBaseKey(): string {
		return 'learningRecord'
	}

	protected convert(cacheHit: string): LearningRecord {
		return plainToClass(LearningRecord, cacheHit)
	}
}
