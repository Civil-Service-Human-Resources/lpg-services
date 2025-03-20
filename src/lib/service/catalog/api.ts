import * as model from '../../../lib/model'

export interface PageResults {
	page: number
	results: model.Course[]
	size: number
	totalResults: number
}
