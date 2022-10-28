import {plainToClass} from 'class-transformer'
import * as config from 'lib/config'

import {OrganisationalUnit} from '../../../model'
import { Cache } from '../../../utils/cache';

const cache = new Cache(
    config.ORG_REDIS.host,
    config.ORG_REDIS.port,
    config.ORG_REDIS.password,
)

const getOrgKey = (orgId: number) => {
	return `organisation:${orgId}`
}

const ALL_ORGS_KEY = 'organisations:all'

const getOrganisation = async (organisationId: number): Promise<OrganisationalUnit | undefined> => {
	const key = getOrgKey(organisationId)
	const stringedOrg = await cache.get(key)
	if (stringedOrg) {
		return plainToClass(OrganisationalUnit, stringedOrg)
	}
	return undefined
}

export const getAllOrganisationUnits = async () => {
	const stringedOrgs = await cache.get(ALL_ORGS_KEY)
	if (stringedOrgs) {
		const convertedOrgs: any[] = JSON.parse(stringedOrgs)
		return convertedOrgs.map(OrganisationalUnit.create)
	}
	return undefined
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
