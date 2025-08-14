import {KeyValue} from '../../../../utils/dataUtils'

export class FormattedOrganisation implements KeyValue {
	constructor(
		public id: number,
		public name: string
	) {}

	getId(): string {
		return this.id.toString()
	}
}
