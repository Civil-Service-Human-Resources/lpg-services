import {OrganisationalUnit, User} from '../../model'
import * as organisationalUnitCache from './organisationalUnit/organisationalUnitCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

export async function getOrgHierarchy(organisationId: number, user: User): Promise<string[]> {
	let hierarchy = await organisationalUnitCache.getOrgHierarchy(organisationId)
	if (hierarchy === undefined) {
		const orgArray: OrganisationalUnit[] = await organisationalUnitClient.getParentOrgsWithId(organisationId, user)
		hierarchy = orgArray.map(org => org.code)
	}
	return hierarchy
}

export async function getAllOrganisationUnits(user: User): Promise<OrganisationalUnit[]> {
	let orgs = await organisationalUnitCache.getAllOrganisationUnits()
	if (orgs === undefined) {
		orgs = await organisationalUnitClient.getAllOrganisationUnits(user)
	}
	return orgs
}

export async function getOrganisationDropdown(user: User): Promise<OrganisationalUnit[]> {
	const userDomain = user.userName.split('@')[1]
	let dropdown = await organisationalUnitCache.getOrganisationalUnitDropdown(userDomain)
	if (dropdown === undefined) {
		dropdown = await organisationalUnitClient.getAllOrgsFlatWithEmailFilter(userDomain, user)
	}
	return dropdown
}
