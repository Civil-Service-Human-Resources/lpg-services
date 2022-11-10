import {plainToClass} from 'class-transformer'
import {Cache} from 'lib/utils/cache'

import {OrganisationalUnitTypeAhead} from '../models/organisationalUnitTypeAhead'

export class OrganisationalUnitTypeaheadCache extends Cache<OrganisationalUnitTypeAhead> {
	getBaseKey(): string {
		return 'organisationalUnits'
	}

	async getTypeahead(): Promise<OrganisationalUnitTypeAhead | undefined> {
		return await this.get('typehead')
	}

	async setTypeahead(typeahead: OrganisationalUnitTypeAhead, ttlOverride?: number) {
		await this.set('typeahead', typeahead, ttlOverride)
	}

	protected convert(cacheHit: string): OrganisationalUnitTypeAhead {
		return plainToClass(OrganisationalUnitTypeAhead, cacheHit)
	}
}
