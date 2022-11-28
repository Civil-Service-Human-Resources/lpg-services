import { plainToClass } from 'class-transformer'
import { User } from '../../model'
import { client } from './config'
import { GetCoursesParams, GetCoursesResponse } from './models/GetCoursesParams'

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
