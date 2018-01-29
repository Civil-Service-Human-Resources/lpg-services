export interface Entry {
	tags?: string[]
	title?: string
	type?: string
	uid?: string
	uri?: string
	shortDescription?: string
	description?: string
	learningOutcomes?: string
}

export interface SearchRequest {
	tags?: string[]
	first?: number
	after?: string
}

export interface SearchResponse {
	entries: Entry[]
}
