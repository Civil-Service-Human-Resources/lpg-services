import {plainToClass, plainToInstance} from 'class-transformer'

import {Course, User} from '../../model'
import {client} from './config'
import {CourseSearchParams} from './models/courseSearchParams'
import {CourseSearchResponse} from './models/courseSearchResponse'
import {GetCoursesParams, GetCoursesResponse} from './models/getCoursesParams'

const COURSES_URL = 'courses'
const COURSES_V2_URL = `v2/${COURSES_URL}`
const SEARCH_URL = 'search'

export async function getCoursesWithIds(ids: string[], user: User) {
	const resp = await client._post<string[], Course[]>(
		{
			url: `${COURSES_URL}/getIds`,
		},
		ids,
		user
	)
	return resp.map(c => Course.create(c, user))
}

export async function getCoursesV2(getCoursesParams: GetCoursesParams, user: User) {
	const resp = await client._get<GetCoursesResponse>(
		{
			params: getCoursesParams,
			url: `${COURSES_V2_URL}`,
		},
		user
	)
	return plainToClass(GetCoursesResponse, resp)
}

export async function courseSearch(params: CourseSearchParams, user: User): Promise<CourseSearchResponse> {
	const resp = await client._get<GetCoursesResponse>(
		{
			params,
			url: `${SEARCH_URL}`,
		},
		user
	)
	const responseData = plainToInstance(CourseSearchResponse, resp)
	responseData.results = responseData.results.map(c => {
		return Course.create(c, user)
	})
	return responseData
}
