import { OrganisationalUnit, User } from '../../model'
import { OrderBy } from './models/getOrganisationsRequestOptions'
import { OrganisationalUnitTypeAhead } from './models/organisationalUnitTypeAhead'
import { OrganisationalUnitCache } from './organisationalUnit/organisationalUnitCache'
import {
	OrganisationalUnitTypeaheadCache
} from './organisationalUnit/organisationalUnitTypeaheadCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

let organisationalUnitCache: OrganisationalUnitCache
let organisationalUnitTypeaheadCache: OrganisationalUnitTypeaheadCache

export function setCaches(orgCache: OrganisationalUnitCache, orgTypeaheadCache: OrganisationalUnitTypeaheadCache) {
	organisationalUnitCache = orgCache
	organisationalUnitTypeaheadCache = orgTypeaheadCache
}

async function refreshTypeahead(user: User) {
	const organisationalUnits = await organisationalUnitClient.getOrganisationalUnits(
		{includeFormattedName: true, orderBy: OrderBy.FORMATTED_NAME},
		user
	)
	const typeahead = new OrganisationalUnitTypeAhead(organisationalUnits)
	await organisationalUnitTypeaheadCache.setTypeahead(typeahead)
	return organisationalUnits
}

export async function getOrgHierarchy(
	organisationId: number,
	user: User,
	hierarchy: OrganisationalUnit[] = []
): Promise<OrganisationalUnit[]> {
	let org = await organisationalUnitCache.get(organisationId)
	if (org == null) {
		org = await organisationalUnitClient.getOrganisationalUnit(
			organisationId,
			{includeFormattedName: true, includeParents: true},
			user
		)
		while (org) {
			hierarchy.push(org)
			organisationalUnitCache.set(org.id, org)
			org = org.parent
		}
		return hierarchy
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
		const flatOrgs = await refreshTypeahead(user)
		typeahead = new OrganisationalUnitTypeAhead(flatOrgs)
	}
	return typeahead
}

export async function getOrganisationDropdown(user: User): Promise<OrganisationalUnit[]> {
	const typeahead = await getAllOrganisationUnits(user)
	const userDomain = user.userName.split('@')[1]
	return typeahead.getDomainFilteredList(userDomain)
}
