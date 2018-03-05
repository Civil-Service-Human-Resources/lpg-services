import * as model from 'lib/model'

export interface SearchResponse {
	entries: model.Course[]
}

export interface TextSearchResponse {
	suggestion?: string
	entries: model.TextSearchResult[]
}
