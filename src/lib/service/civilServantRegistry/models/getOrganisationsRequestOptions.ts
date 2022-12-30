export interface GetOrganisationsRequestOptions {
	page: number
	size: number
	sort?: string
}

export interface GetOrganisationRequestOptions {
	includeParents?: boolean
}
