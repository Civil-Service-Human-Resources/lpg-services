import {BasicCourse} from '../../../../lib/service/cslService/models/learning/learningPlan/basicCourse'

export class SearchCourse extends BasicCourse {
	public inLearningPlan: boolean
}

export interface PaginationNumberedPage {
	number?: number
	link?: string
	ellipses?: boolean
}

export interface Pagination {
	start: number
	end: number
	total: number
	prevLink?: string
	nextLink?: string
	numberedPages: PaginationNumberedPage[]
}

export interface SearchFilter {
	id: string
	value: string
	label: string
	checked: boolean
}

export interface Filters {
	selectedLearningTypes: SearchFilter[]
	showFree: boolean
	userDepartment: SearchFilter
	otherDepartments: SearchFilter[]
	userAreasOfWork: SearchFilter[]
	otherAreasOfWork: SearchFilter[]
	userInterests: SearchFilter[]
	otherInterests: SearchFilter[]
}

export class SearchPageModel {
	constructor(
		public filters: Filters,
		public query: string,
		public searchResults: SearchCourse[],
		public pagination: Pagination
	) {}
}
