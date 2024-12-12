import {plainToClass} from 'class-transformer'

import {Course, User} from '../../model'
import {client} from './config'
import {GetCoursesParams, GetCoursesResponse} from './models/getCoursesParams'

const URL = 'courses'

export async function getCoursesWithIds(ids: string[], user: User) {
	const resp = await client._post<string[], Course[]>(
		{
			url: `${URL}/getIds`,
		},
		ids,
		user
	)
	return resp.map(c => Course.create(c, user))
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
