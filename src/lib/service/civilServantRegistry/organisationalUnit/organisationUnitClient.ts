import {OrganisationalUnit, User} from '../../../model'
import {client} from '../config'

const URL = '/organisationalUnits'

export async function getAllOrgsFlat(user: User): Promise<OrganisationalUnit[]> {
	const path: string = `${URL}/flat`
	return await client._get<OrganisationalUnit[]>(
		{
			url: path,
		},
		user
	)
}

export async function getAllOrgsFlatWithEmailFilter(userDomain: string, user: User): Promise<OrganisationalUnit[]> {
	const path: string = `${URL}/flat/${userDomain}/`
	return await client._get<OrganisationalUnit[]>(
		{
			url: path,
		},
		user
	)
}

export async function getAllOrganisationUnits(user: User): Promise<OrganisationalUnit[]> {
	return await client._get<OrganisationalUnit[]>(
		{
			url: URL,
		},
		user
	)
}

export async function getParentOrgsWithId(organisationId: number, user: User): Promise<OrganisationalUnit[]> {
	const path: string = `/organisationalUnits/parentWithId/${organisationId}`
	return await client._get<OrganisationalUnit[]>(
		{
			url: path,
		},
		user
	)
}
