import {plainToClass} from 'class-transformer'
import {Cache} from 'lib/utils/cache'
import {CourseRecord} from './models/courseRecord'

export class CourseRecordCache extends Cache<CourseRecord> {
	getBaseKey(): string {
		return 'course_record'
	}

	protected convert(cacheHit: string): CourseRecord {
		return plainToClass(CourseRecord, cacheHit)
	}
}
