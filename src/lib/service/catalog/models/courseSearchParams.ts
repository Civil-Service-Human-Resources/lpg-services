import {CourseSearchQuery} from '../../../../ui/controllers/search/models/courseSearchQuery'

export type costType = 'free'
export type typesType = 'face-to-face' | 'link' | 'online' | 'video'

export class CourseSearchParams {
	constructor(public page: number,
							public size: number,
							public status: string,
							public visibility: string,
							public searchTerm?: string,
							public areasOfWork?: string[],
							public departments?: string[],
							public interests?: string[],
							public cost?: costType,
							public types?: typesType[],) { }
}


export function buildParams(query: CourseSearchQuery) {
	const page = query.p === 0 ? query.p : query.p - 1
	return new CourseSearchParams(
		page, 10, 'PUBLISHED', 'PUBLIC',
		query.q, query.areaOfWork, query.department, query.interest, query.cost, query.courseType
	)
}
