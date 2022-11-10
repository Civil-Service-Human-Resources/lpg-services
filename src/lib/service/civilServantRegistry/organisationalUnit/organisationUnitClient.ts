import {OrganisationalUnit, User} from '../../../model'
import {client} from '../config'
import { GetOrganisationsRequestOptions, GetOrganisationRequestOptions } from '../models/getOrganisationsRequestOptions';
import { GetOrganisationsResponse } from '../models/getOrganisationsResponse';
import { plainToInstance } from 'class-transformer';

const URL = '/v2/organisationalUnits'

export async function getOrganisationalUnits(options: GetOrganisationsRequestOptions, user: User): Promise<OrganisationalUnit[]> {
	const resp: GetOrganisationsResponse = await client._get<GetOrganisationsResponse>(
		{ 
			url: URL,
			params: options
		},
		user
	)
	const responseData = plainToInstance(GetOrganisationsResponse, resp)
	return responseData.organisationalUnits
}

export async function getOrganisationalUnit(organisationId: number, options: GetOrganisationRequestOptions, user: User): Promise<OrganisationalUnit> {
	const path: string = `${URL}/${organisationId}`
	const resp: OrganisationalUnit = await client._get<OrganisationalUnit>(
		{
			url: path,
			params: options
		},
		user
	)
	return plainToInstance(OrganisationalUnit, resp)
}
