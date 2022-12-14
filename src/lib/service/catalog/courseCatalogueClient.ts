import { plainToClass } from 'class-transformer'
import { User } from '../../model'
import { client } from './config'
import { GetCoursesParams, GetCoursesResponse } from './models/getCoursesParams'

const URL = 'courses'

export async function getCourses(getCoursesParams: GetCoursesParams, user: User) {
	const resp = client._get<GetCoursesResponse>(
		{
			params: getCoursesParams,
			url: URL,
		},
		user
	)
	return plainToClass(GetCoursesResponse, resp)
}

export async function getCoursesV2(getCoursesParams: GetCoursesParams, user: User) {
	const resp = client._get<GetCoursesResponse>(
		{
			params: getCoursesParams,
			url: `v2/${URL}`,
		},
		user
	)
	return plainToClass(GetCoursesResponse, resp)
}
