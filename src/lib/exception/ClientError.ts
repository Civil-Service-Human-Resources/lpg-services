export class ClientError extends Error {
	constructor(readonly message: string) {
		super(message)
	}
}
