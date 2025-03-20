import {Type} from 'class-transformer'
import {Course} from '../../../model'

export class CourseSearchResponse {
	@Type(() => Course)
	results: Course[]

	page: number
	totalResults: number
	size: number
}
