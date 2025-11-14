export class GetOrganisationalUnitParams {
	constructor(
		public organisationId?: number[],
		public includeParents?: boolean
	) {}
}
