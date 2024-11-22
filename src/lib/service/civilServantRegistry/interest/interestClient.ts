import {plainToInstance} from 'class-transformer'
import {User} from '../../../model'
import {Interest} from '../../../registry'
import {client} from '../config'
import {GetInterestsResponse} from '../models/getInterestsResponse'

const URL = 'interests'

export async function getInterests(user: User): Promise<Interest[]> {
	const resp: GetInterestsResponse = await client._get<GetInterestsResponse>(
		{
			url: URL,
		},
		user
	)
	return plainToInstance(GetInterestsResponse, resp).interests
}
