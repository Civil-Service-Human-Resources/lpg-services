import {Course} from '../../model/course'

export interface SearchRequest {
	tags?: string[]
	first?: number
	after?: string
}

export interface SearchResponse {
	entries: Course[]
}
