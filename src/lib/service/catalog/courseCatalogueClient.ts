import {plainToClass, plainToInstance} from 'class-transformer'
import * as model from '../../model'
import {User} from '../../model'
import {client} from './config'
import {CourseSearchParams} from './models/courseSearchParams'
import {CourseSearchResponse} from './models/courseSearchResponse'
import {GetCoursesParams, GetCoursesResponse} from './models/getCoursesParams'

const COURSES_URL = 'courses'
const COURSES_V2_URL = `v2/${COURSES_URL}`
const SEARCH_URL = 'search'

export async function getCourse(id: string, user: User, includeAvailability: boolean = false) {
	try {
		const resp = await client._get(
			{
				url: `${COURSES_URL}/${id}`,
				params: {
					includeAvailability,
				},
			},
			user
		)
		return model.CourseFactory.create(resp, user)
	} catch (e) {
		if (e.response && e.response.status === 404) {
			return null
		}
		throw new Error(`Error getting course - ${e}`)
	}
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

export async function courseSearch(
	params: CourseSearchParams,
	user: User,
	departmentHierarchyCodes: string[]
): Promise<CourseSearchResponse> {
	const resp = await client._get<GetCoursesResponse>(
		{
			params,
			url: `${SEARCH_URL}`,
		},
		user
	)
	const responseData = plainToInstance(CourseSearchResponse, resp)
	responseData.results = await Promise.all(
		responseData.results.map(c => {
			return model.CourseFactory.create(c, user, departmentHierarchyCodes)
		})
	)
	return responseData
}
