import {SearchFilterable, SearchLabel} from '../../../../../ui/controllers/search/models/searchPageModel'
import {KeyValue} from '../../../../utils/dataUtils'

export class FormattedOrganisation implements KeyValue, SearchFilterable {
	constructor(
		public id: number,
		public name: string,
		public code: string,
		public abbreviation: string = ''
	) {}

	getAsSearchFilter(): SearchLabel {
		return {
			id: this.code,
			value: this.code,
			label: this.getNameNoAbbrev(),
		}
	}
	getValue(): string {
		return this.code
	}

	getName() {
		const parts = this.name.split('|')
		return parts[parts.length - 1].trim()
	}

	getNameNoAbbrev() {
		return this.getName().replace(` (${this.abbreviation})`, '')
	}

	getId(): string {
		return this.id.toString()
	}
}
