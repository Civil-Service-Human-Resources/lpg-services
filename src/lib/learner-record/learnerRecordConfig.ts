/* tslint:disable */
export class LearnerRecordConfig {
	private _uri: string

	constructor(uri: string) {
		this._uri = uri
	}


	get uri() {
		return this._uri
	}
}