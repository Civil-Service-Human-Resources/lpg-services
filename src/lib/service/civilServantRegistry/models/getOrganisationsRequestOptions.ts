export enum OrderDirection {
	ASC = 'ASC',
	DESC = 'DESC',
}

export enum OrderBy {
	NAME = 'NAME',
	FORMATTED_NAME = 'FORMATTED_NAME',
}

export interface GetOrganisationsRequestOptions {
	includeFormattedName?: boolean
	orderBy?: OrderBy
	orderDirection?: OrderDirection
}

export interface GetOrganisationRequestOptions {
	includeFormattedName?: boolean
	includeParents?: boolean
}
