import {Expose, Type} from 'class-transformer'
import {OrganisationalUnit} from '../../../model'

export class GetOrganisationsResponse {
	@Expose({name: '_embedded'})
	@Type(() => Embedded)
	embedded: Embedded

	@Type(() => PageObject)
	page: PageObject
}

export class Embedded {
	@Type(() => OrganisationalUnit)
	organisationalUnits: OrganisationalUnit[]
}

export class PageObject {
	size: number
	totalElements: number
	totalPages: number
	number: number
}
