import {plainToClass, plainToInstance} from 'class-transformer'
import {Cache} from 'lib/utils/cache'

import {OrganisationalUnit} from '../../../model'

export class OrganisationalUnitCache extends Cache<OrganisationalUnit> {
	async getOrgHierarchy(organisationId: number, hierarchy: string[] = []): Promise<string[] | undefined> {
		const currentOrg = await this.get(organisationId)
		if (currentOrg !== undefined) {
			hierarchy.push(currentOrg.code)
			if (currentOrg.parentId && currentOrg.parentId !== 0) {
				return await this.getOrgHierarchy(currentOrg.parentId, hierarchy)
			}
			return hierarchy
		} else {
			return undefined
		}
	}

	protected getFormattedKey(keyPart: string): string {
		return `organisationalUnits:${keyPart}`
	}

	protected convertList(cachedList: any[]): OrganisationalUnit[] {
		return plainToInstance(OrganisationalUnit, cachedList)
	}

	protected convert(cacheHit: string): OrganisationalUnit {
		return plainToClass(OrganisationalUnit, cacheHit)
	}
}
