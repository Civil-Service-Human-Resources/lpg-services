import * as model from 'lib/model'

export interface PageResults {
	page: number
	results: model.Course[]
	size: number
	totalResults: number
}

export interface ResourceResults {
	page: number
	results: Array<model.Resource | model.CourseModule>
	size: number
	totalResults: number
}

export interface SearchResults extends ResourceResults {
	combinedResults: model.CourseModule[]
	suggestion?: string
}
