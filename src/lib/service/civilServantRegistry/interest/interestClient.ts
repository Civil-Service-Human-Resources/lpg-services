import {plainToInstance} from 'class-transformer'
import {User} from 'lib/model'
import {Interest} from 'lib/registry'
import {GetInterestsResponse} from 'lib/service/civilServantRegistry/models/getInterestsResponse'
import {client} from '../config'

const URL = "interests"

export async function getInterests(user: User): Promise<Interest[]> {
	const resp: GetInterestsResponse = await client._get<GetInterestsResponse>(
		{
			url: URL,
		},
		user
	)
	return plainToInstance(GetInterestsResponse, resp).interests
}
