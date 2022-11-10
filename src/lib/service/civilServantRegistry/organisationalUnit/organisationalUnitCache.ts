import {plainToClass} from 'class-transformer'
import {Cache} from 'lib/utils/cache'

import {OrganisationalUnit} from '../../../model'

export class OrganisationalUnitCache extends Cache<OrganisationalUnit> {
	getBaseKey(): string {
		return 'organisationalUnits'
	}

	protected convert(cacheHit: string): OrganisationalUnit {
		return plainToClass(OrganisationalUnit, cacheHit)
	}
}
