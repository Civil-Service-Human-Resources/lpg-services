import * as model from 'lib/model'

export interface PageResults {
	page: number
	results: model.Course[]
	size: number
	totalResults: number
}

export interface ResourceResults {
	page: number
	results: model.Resource[]
	size: number
	totalResults: number
}

export interface SearchResults extends ResourceResults {
	suggestion?: string
}
