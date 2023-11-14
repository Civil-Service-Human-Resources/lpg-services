import {plainToInstance} from 'class-transformer'

import {OrganisationalUnit, User} from '../../../model'
import {client} from '../config'
import {GetOrganisationRequestOptions, GetOrganisationsRequestOptions} from '../models/getOrganisationsRequestOptions'
import {GetOrganisationsResponse} from '../models/getOrganisationsResponse'

const URL = '/organisationalUnits'
const V2_URL = `/v2${URL}`
const MAX_PER_PAGE = 200

export async function getAllOrganisationalUnits(user: User): Promise<OrganisationalUnit[]> {
	const orgs: OrganisationalUnit[] = []
	const response = await getOrganisationalUnits(
		{
			page: 0,
			size: 1,
		},
		user
	)
	if (response.totalElements >= 1) {
		const totalPages = Math.ceil(response.totalElements / MAX_PER_PAGE)
		const requests: any[] = []
		for (let page = 0; page < totalPages; page++) {
			requests.push(getOrganisationalUnits({size: MAX_PER_PAGE, page}, user)
			.then(data => {
				orgs.push(...data.content)
			}))
		}
		await Promise.all(requests)
	}
	return orgs
}

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
