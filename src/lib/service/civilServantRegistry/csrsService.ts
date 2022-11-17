import {OrganisationalUnit, User} from '../../model'
import {OrganisationalUnitTypeAhead} from './models/organisationalUnitTypeAhead'
import {OrganisationalUnitCache} from './organisationalUnit/organisationalUnitCache'
import {OrganisationalUnitTypeaheadCache} from './organisationalUnit/organisationalUnitTypeaheadCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

let organisationalUnitCache: OrganisationalUnitCache
let organisationalUnitTypeaheadCache: OrganisationalUnitTypeaheadCache

export function setCaches(orgCache: OrganisationalUnitCache, orgTypeaheadCache: OrganisationalUnitTypeaheadCache) {
	organisationalUnitCache = orgCache
	organisationalUnitTypeaheadCache = orgTypeaheadCache
}

async function getOrganisationFromApi(
	user: User,
	organisationalUnitId: number,
	includeParent: boolean = false
): Promise<OrganisationalUnit> {
	const organisation: OrganisationalUnit = await organisationalUnitClient.getOrganisationalUnit(
		organisationalUnitId,
		{includeParents: includeParent},
		user
	)
	let fetchedOrg: OrganisationalUnit | undefined = organisation
	while (fetchedOrg != null) {
		await organisationalUnitCache.set(fetchedOrg.id, fetchedOrg)
		fetchedOrg = fetchedOrg.parent
	}
	return organisation
}

export async function getOrganisation(
	user: User,
	organisationalUnitId: number,
	includeParent: boolean = false
): Promise<OrganisationalUnit> {
	let org = await organisationalUnitCache.get(organisationalUnitId)
	if (org === undefined) {
		org = await getOrganisationFromApi(user, organisationalUnitId, includeParent)
	}
	if (includeParent && org.parentId != null && org.parent == null) {
		org.parent = await getOrganisation(user, org.parentId)
	}
	return org
}

async function refreshTypeahead(user: User): Promise<OrganisationalUnitTypeAhead> {
	const organisationalUnits = await organisationalUnitClient.getAllOrganisationalUnits(user)
	const typeahead = OrganisationalUnitTypeAhead.createAndSort(organisationalUnits)
	await organisationalUnitTypeaheadCache.setTypeahead(typeahead)
	return typeahead
}

export async function getOrgHierarchy(
	organisationId: number,
	user: User,
	hierarchy: OrganisationalUnit[] = []
): Promise<OrganisationalUnit[]> {
	const org = await organisationalUnitCache.get(organisationId)
	if (org == null) {
		const orgWithAllParents = await getOrganisationFromApi(user, organisationId, true)
		return orgWithAllParents.getHierarchyAsArray()
	} else {
		hierarchy.push(org)
		if (org.parentId) {
			return await getOrgHierarchy(org.parentId, user, hierarchy)
		}
	}
	return hierarchy
}

export async function getAllOrganisationUnits(user: User): Promise<OrganisationalUnitTypeAhead> {
	let typeahead = await organisationalUnitTypeaheadCache.getTypeahead()
	if (typeahead === undefined) {
		typeahead = await refreshTypeahead(user)
	}
	return typeahead
}

export async function getOrganisationDropdown(user: User): Promise<OrganisationalUnit[]> {
	const typeahead = await getAllOrganisationUnits(user)
	const userDomain = user.userName.split('@')[1]
	return typeahead.getDomainFilteredList(userDomain)
}
