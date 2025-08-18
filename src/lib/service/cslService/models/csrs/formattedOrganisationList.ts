import {Type} from 'class-transformer'
import {CacheableObject} from '../../../../utils/cacheableObject'
import {FormattedOrganisation} from './formattedOrganisation'

export class FormattedOrganisationList implements CacheableObject {
	private _id: string
	@Type(() => FormattedOrganisation)
	public formattedOrganisations: FormattedOrganisation[]

	constructor(id: string, formattedOrganisations: FormattedOrganisation[]) {
		this._id = id
		this.formattedOrganisations = formattedOrganisations
	}

	getId(): string {
		return this._id
	}
}
