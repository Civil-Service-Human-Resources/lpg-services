export class ResourceNotFoundError extends Error {
	constructor(readonly url: string) {
		super(`Resource with URL ${url} was not found`)
	}
}
