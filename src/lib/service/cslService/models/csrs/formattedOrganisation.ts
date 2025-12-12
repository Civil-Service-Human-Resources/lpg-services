import {KeyValue} from '../../../../utils/dataUtils'

export class FormattedOrganisation implements KeyValue {
	constructor(
		public id: number,
		public name: string,
		public code: string,
		public abbreviation: string = ''
	) {}

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
