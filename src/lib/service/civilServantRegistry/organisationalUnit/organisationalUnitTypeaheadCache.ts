import { Cache } from 'lib/utils/cache'
import { OrganisationalUnitTypeAhead } from '../models/organisationalUnitTypeAhead';
import { plainToClass } from 'class-transformer';

export class OrganisationalUnitTypeaheadCache extends Cache<OrganisationalUnitTypeAhead> {

    getBaseKey(): string {
        return "organisationalUnits"
    }

	protected convert(cacheHit: string): OrganisationalUnitTypeAhead {
		return plainToClass(OrganisationalUnitTypeAhead, cacheHit)
	}

    async getTypeahead(): Promise<OrganisationalUnitTypeAhead | undefined> {
        return await this.get("typehead")
    }

    async setTypeahead(typeahead: OrganisationalUnitTypeAhead, ttlOverride?: number) {
        await this.set("typeahead", typeahead, ttlOverride)
    }

}