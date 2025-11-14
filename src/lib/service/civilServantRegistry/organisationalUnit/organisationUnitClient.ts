import {plainToInstance} from 'class-transformer'

import {User} from '../../../model'
import {client} from '../config'
import {GetOrganisationsRequestOptions} from '../models/getOrganisationsRequestOptions'
import {GetOrganisationsResponse} from '../models/getOrganisationsResponse'

const URL = '/organisationalUnits'
const V2_URL = `/v2${URL}`

export async function getOrganisationalUnits(
	options: GetOrganisationsRequestOptions,
	user: User
): Promise<GetOrganisationsResponse> {
	const resp: GetOrganisationsResponse = await client._get<GetOrganisationsResponse>(
		{
			params: options,
			url: V2_URL,
		},
		user
	)
	return plainToInstance(GetOrganisationsResponse, resp)
}
