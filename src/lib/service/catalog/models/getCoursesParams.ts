import { Type } from 'class-transformer'

import { Course } from '../../../model'

const DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC = 200

export class GetCoursesParams {
	public static createForDepartments(departmentCodes: string[], grade?: string) {
		return new GetCoursesParams(grade, undefined, departmentCodes.join(','))
	}

	public static createForAreaOfWork(areaOfWork: string, grade?: string) {
		return new GetCoursesParams(grade, areaOfWork)
	}

	public static createForInterest(interest: string, grade?: string) {
		return new GetCoursesParams(grade, undefined, interest)
	}
	constructor(
		public grade?: string,
		public areaOfWork?: string,
		public department?: string,
		public interest?: string,
		public page: number = 0,
		public size: number = DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC
	) {}
}

export class GetCoursesResponse {
	public page: number
	@Type(() => Course)
	public results: Course[]
	public size: number
	public totalResults: number
}
