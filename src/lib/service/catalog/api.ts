import * as model from 'lib/model'

export interface SearchRequest {
	tags?: string[]
	first?: number
	after?: string
}

export interface SearchResponse {
	entries: model.Course[]
}
