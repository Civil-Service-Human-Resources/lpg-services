import { OrganisationalUnit, User } from '../../model'
import { OrganisationalUnitCache } from './organisationalUnit/organisationalUnitCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

let cache: OrganisationalUnitCache

export function setCache(orgCache: OrganisationalUnitCache) {
	cache = orgCache
}

export async function getOrgHierarchy(organisationId: number, user: User): Promise<string[]> {
	let hierarchy = await cache.getOrgHierarchy(organisationId)
	if (hierarchy === undefined) {
		const orgArray: OrganisationalUnit[] = await organisationalUnitClient.getParentOrgsWithId(organisationId, user)
		hierarchy = orgArray.map(org => org.code)
	}
	return hierarchy
}

export async function getAllOrganisationUnits(user: User): Promise<OrganisationalUnit[]> {
	let orgs = await cache.getList()
	if (orgs === undefined) {
		orgs = await organisationalUnitClient.getAllOrganisationUnits(user)
	}
	return orgs
}

export async function getOrganisationDropdown(user: User): Promise<OrganisationalUnit[]> {
	const userDomain = user.userName.split('@')[1]
	let dropdown = await cache.getList()
	if (dropdown === undefined) {
		dropdown = await organisationalUnitClient.getAllOrgsFlatWithEmailFilter(userDomain, user)
	} else {
		const filteredOrgs = dropdown.filter(o => o.agencyToken.agencyDomains.includes(userDomain))
		if (filteredOrgs.length > 0) {
			dropdown = filteredOrgs
		}
	}
	return dropdown
}
