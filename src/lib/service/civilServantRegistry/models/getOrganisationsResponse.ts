import {Expose} from 'class-transformer'
import {OrganisationalUnit} from '../../../model'

export class GetOrganisationsResponse {
	@Expose({name: '_embedded'})
	embedded: {
		organisationalUnits: OrganisationalUnit[]
	}
	page: PageObject
}

export class PageObject {
	size: number
	totalElements: number
	totalPages: number
	number: number
}
