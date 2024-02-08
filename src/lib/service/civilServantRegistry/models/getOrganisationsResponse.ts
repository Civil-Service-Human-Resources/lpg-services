import {Type} from 'class-transformer'
import {OrganisationalUnit} from '../../../model'

export class GetOrganisationsResponse {
	@Type(() => OrganisationalUnit)
	content: OrganisationalUnit[]
	size: number
	totalElements: number
	totalPages: number
	number: number
}
