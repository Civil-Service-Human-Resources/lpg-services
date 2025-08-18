import {plainToInstance} from 'class-transformer'

import {OrganisationalUnit, User} from '../../../model'
import {client} from '../config'
import {GetOrganisationRequestOptions, GetOrganisationsRequestOptions} from '../models/getOrganisationsRequestOptions'
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

export async function getOrganisationalUnit(
	organisationId: number,
	options: GetOrganisationRequestOptions,
	user: User
): Promise<OrganisationalUnit> {
	const path: string = `${V2_URL}/${organisationId}`
	const resp: OrganisationalUnit = await client._get<OrganisationalUnit>(
		{
			params: options,
			url: path,
		},
		user
	)
	return plainToInstance(OrganisationalUnit, resp)
}
