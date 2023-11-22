import {plainToClass} from 'class-transformer'
import {CacheableObjectCache} from 'lib/utils/cacheableObjectCache'

import {OrganisationalUnit} from '../../../model'

export class OrganisationalUnitCache extends CacheableObjectCache<OrganisationalUnit> {
	getBaseKey(): string {
		return 'organisationalUnits'
	}

	async set(id: string | number, organisationalUnit: OrganisationalUnit, ttlOverride?: number) {
		organisationalUnit.parent = undefined
		organisationalUnit.children = []
		super.set(id, organisationalUnit, ttlOverride)
	}

	protected convert(cacheHit: string): OrganisationalUnit {
		return plainToClass(OrganisationalUnit, cacheHit)
	}
}
