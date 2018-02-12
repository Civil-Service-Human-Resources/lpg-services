export class User {
	readonly id: string
	readonly emailAddress: string
	readonly nameID: string
	readonly nameIDFormat: string
	readonly sessionIndex: string

	public department: string
	public profession: string
	public givenName: string
	public grade: string

	constructor(
		id: string,
        emailAddress: string,
		nameID: string,
		nameIDFormat: string,
		sessionIndex: string
	) {
		this.id = id
		this.emailAddress = emailAddress
		this.nameID = nameID
		this.nameIDFormat = nameIDFormat
		this.sessionIndex = sessionIndex
	}

	hasCompleteProfile() {
		return this.department && this.profession && this.grade
	}
}
