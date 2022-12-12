import { Type } from 'class-transformer'

import { Course } from '../../../model'

export interface GetCoursesParams {
	grade?: string,
	areaOfWork?: string,
	departments?: string,
	interest?: string,
	excludeAreasOfWork?: string[],
	excludeInterests?: string[],
	excludeDepartments?: string[],
	page: number,
	size: number
}

export class GetCoursesResponse {
	public page: number
	@Type(() => Course)
	public results: Course[]
	public size: number
	public totalResults: number
}
