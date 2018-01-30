export interface Entry {
	shortDescriptionb?: string
	tags?: string[]
	title?: string
	uid?: string
	uri?: string
}

export interface SearchRequest {
	tags?: string[]
	first?: number
	after?: string
}

export interface SearchResponse {
	entries: Entry[]
}
