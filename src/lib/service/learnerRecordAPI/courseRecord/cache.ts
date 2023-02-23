import {plainToClass} from 'class-transformer'
import {Cache} from 'lib/utils/cache'
import {CourseRecord} from './models/courseRecord'

export class CourseRecordCache extends Cache<CourseRecord> {
	getBaseKey(): string {
		return 'organisationalUnits'
	}

	async set(id: string | number, organisationalUnit: CourseRecord, ttlOverride?: number) {
		super.set(id, organisationalUnit, ttlOverride)
	}

	protected convert(cacheHit: string): CourseRecord {
		return plainToClass(CourseRecord, cacheHit)
	}
}
