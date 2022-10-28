import {plainToClass} from 'class-transformer'

import {OrganisationalUnit} from '../../../model'
import {Cache} from '../../../utils/cache'

export class OrganisationalUnitCache extends Cache<OrganisationalUnit> {
	protected convertList(cachedList: string[]): OrganisationalUnit[] {
		return plainToClass(OrganisationalUnit, cachedList)
	}

	protected convert(cacheHit: any): OrganisationalUnit {
		return plainToClass(OrganisationalUnit, cacheHit)
	}
}
