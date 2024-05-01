import {getLogger} from '../../logger'
import {OrganisationalUnit, User} from '../../model'
import {OrganisationalUnitTypeAhead} from './models/organisationalUnitTypeAhead'
import {OrganisationalUnitCache} from './organisationalUnit/organisationalUnitCache'
import {OrganisationalUnitTypeaheadCache} from './organisationalUnit/organisationalUnitTypeaheadCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

const logger = getLogger('csrsService')

let organisationalUnitCache: OrganisationalUnitCache
let organisationalUnitTypeaheadCache: OrganisationalUnitTypeaheadCache

export function setCaches(orgCache: OrganisationalUnitCache, orgTypeaheadCache: OrganisationalUnitTypeaheadCache) {
	organisationalUnitCache = orgCache
	organisationalUnitTypeaheadCache = orgTypeaheadCache
}

export async function getOrganisation(
	user: User,
	organisationalUnitId: number,
	includeParent: boolean = false
): Promise<OrganisationalUnit> {
	let org = await organisationalUnitCache.get(organisationalUnitId)
	if (org === undefined) {
		org = await organisationalUnitClient.getOrganisationalUnit(
			organisationalUnitId,
			{includeParents: includeParent},
			user
		)
		await organisationalUnitCache.setMultiple(org.getHierarchyAsArray())
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
		const orgWithAllParents = await organisationalUnitClient.getOrganisationalUnit(
			organisationId,
			{includeParents: true},
			user
		)
		const orgArray = orgWithAllParents.getHierarchyAsArray()
		await organisationalUnitCache.setMultiple(orgArray)
		hierarchy.push(...orgArray)
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
	logger.debug(`Filtering dropdown for user ${user.userName}`)
	const typeahead = await getAllOrganisationUnits(user)
	if (user.isUnrestrictedOrgUser()) {
		logger.debug(`User is unrestricted, returning all organisations`)
		return typeahead.typeahead
	} else {
		return typeahead.getDomainFilteredList(user.getDomain())
	}
}
