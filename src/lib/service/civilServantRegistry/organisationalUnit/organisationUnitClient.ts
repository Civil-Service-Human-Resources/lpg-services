import { plainToInstance } from 'class-transformer'

import { OrganisationalUnit, User } from '../../../model'
import { client } from '../config'
import {
	GetOrganisationRequestOptions, GetOrganisationsRequestOptions
} from '../models/getOrganisationsRequestOptions'
import { GetOrganisationsResponse } from '../models/getOrganisationsResponse'

const URL = '/v2/organisationalUnits'

export async function getOrganisationalUnits(
	options: GetOrganisationsRequestOptions,
	user: User
): Promise<OrganisationalUnit[]> {
	const resp: GetOrganisationsResponse = await client._get<GetOrganisationsResponse>(
		{
			params: options,
			url: URL,
		},
		user
	)
	const responseData = plainToInstance(GetOrganisationsResponse, resp)
	return responseData.organisationalUnits
}

export async function getOrganisationalUnit(
	organisationId: number,
	options: GetOrganisationRequestOptions,
	user: User
): Promise<OrganisationalUnit> {
	const path: string = `${URL}/${organisationId}`
	const resp: OrganisationalUnit = await client._get<OrganisationalUnit>(
		{
			params: options,
			url: path,
		},
		user
	)
	return plainToInstance(OrganisationalUnit, resp)
}
