export enum OrderDirection {
    ASC,
    DESC
}

export enum OrderBy {
    NAME,
    FORMATTED_NAME
}

export interface GetOrganisationsRequestOptions {
    /**
     * comma-separated organisational unit ids, leave blank to
     * fetch all.
     */
    ids?: string
    includeFormattedName?: boolean
    orderBy?: OrderBy
    orderDirection?: OrderDirection
}

export interface GetOrganisationRequestOptions {
    includeFormattedName?: boolean
    includeParents?: boolean
}