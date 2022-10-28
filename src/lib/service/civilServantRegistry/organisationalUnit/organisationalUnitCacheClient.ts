import { OrganisationalUnit } from '../../../model'
import { OrganisationalUnitCache } from './organisationalUnitCache'

let cache: OrganisationalUnitCache

export function setCache(orgCache: OrganisationalUnitCache) {
	cache = orgCache
}

const getOrgKey = (orgId: number) => {
	return `organisation:${orgId}`
}

const ALL_ORGS_KEY = 'organisations:all'

const getOrganisation = async (organisationId: number): Promise<OrganisationalUnit | undefined> => {
	const key = getOrgKey(organisationId)
	return await cache.get(key)
}

export const getAllOrganisationUnits = async () => {
	return await cache.getList(ALL_ORGS_KEY)
}

export const getOrgHierarchy = async (
	organisationId: number,
	hierarchy: string[] = []
): Promise<string[] | undefined> => {
	const currentOrg = await getOrganisation(organisationId)
	if (currentOrg !== undefined) {
		hierarchy.push(currentOrg.code)
		if (currentOrg.parentId && currentOrg.parentId !== 0) {
			return await getOrgHierarchy(currentOrg.parentId, hierarchy)
		}
		return hierarchy
	} else {
		return undefined
	}
}

export const getOrganisationalUnitDropdown = async (domain: string) => {
	const orgs = await getAllOrganisationUnits()
	if (orgs !== undefined) {
		const filteredOrgs = orgs.filter(o => o.agencyToken.agencyDomains.includes(domain))
		if (filteredOrgs.length > 0) {
			return filteredOrgs
		}
	}
	return orgs
}
