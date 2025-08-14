import {plainToInstance} from 'class-transformer'
import {CacheableObjectCache} from '../../../../utils/cacheableObjectCache'
import {FormattedOrganisationList} from './formattedOrganisationList'

export class FormattedOrganisationListCache extends CacheableObjectCache<FormattedOrganisationList> {
	getBaseKey(): string {
		return 'formattedOrganisationList'
	}

	async set(id: string | number, formattedOrganisationList: FormattedOrganisationList, ttlOverride?: number) {
		super.set(id, formattedOrganisationList, ttlOverride)
	}

	protected convert(cacheHit: string): FormattedOrganisationList {
		return plainToInstance(FormattedOrganisationList, cacheHit)
	}
}
