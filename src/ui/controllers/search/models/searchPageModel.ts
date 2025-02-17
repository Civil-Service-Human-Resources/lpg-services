import {Course} from '../../../../lib/model'
import {costType, typesType} from '../../../../lib/service/catalog/models/courseSearchParams'

export interface FilterBox {
	other: string[],
	selected: string[],
	yours: string[]
}

export interface PaginationNumberedPage {
	number: number,
	link?: string
}

export interface Pagination {
	start: number,
	end: number,
	total: number,
	prevLink?: string,
	nextLink?: string,
	numberedPages?: PaginationNumberedPage[]
}

export class SearchPageModel {

	constructor(
		public areasOfWork: FilterBox,
		public departments: FilterBox,
		public interests: FilterBox,
		public courseTypes: typesType[],
		public query: string,
		public searchResults: Course[],
		public pagination: Pagination,
		public cost?: costType) { }

}
