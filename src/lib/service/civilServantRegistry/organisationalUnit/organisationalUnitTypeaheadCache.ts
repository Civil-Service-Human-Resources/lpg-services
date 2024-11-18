import {plainToClass} from 'class-transformer'
import {Cache} from '../../../utils/cache'

import {OrganisationalUnitTypeAhead} from '../models/organisationalUnitTypeAhead'

export class OrganisationalUnitTypeaheadCache extends Cache<OrganisationalUnitTypeAhead> {
	TYPEAHEAD_KEY = 'typeahead'

	getBaseKey(): string {
		return 'organisationalUnits'
	}

	async getTypeahead(): Promise<OrganisationalUnitTypeAhead | undefined> {
		return await this.get(this.TYPEAHEAD_KEY)
	}

	async setTypeahead(typeahead: OrganisationalUnitTypeAhead, ttlOverride?: number) {
		await this.set(this.TYPEAHEAD_KEY, typeahead, ttlOverride)
	}

	protected convert(cacheHit: string): OrganisationalUnitTypeAhead {
		return plainToClass(OrganisationalUnitTypeAhead, cacheHit)
	}
}
