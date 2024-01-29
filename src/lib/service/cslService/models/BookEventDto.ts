export class BookEventDto {
	constructor(
		public accessibilityOptions: string[], public learnerEmail: string,
		public learnerName: string, public poNumber?: string) { }

}
