export class GetOrganisationsFormattedParams {
	constructor(
		public domain?: string,
		public organisationId?: number[]
	) {}

	public getCacheKey() {
		if (this.domain === undefined && this.organisationId === undefined) {
			return 'all'
		} else {
			const parts = [this.domain]
			if (this.organisationId !== undefined) {
				parts.push(...this.organisationId.map(o => o.toString()))
			}
			return parts.join(',')
		}
	}
}
