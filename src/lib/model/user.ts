export class User {
	readonly id: string
	readonly email: string
	public department: string
	public profession: string
	public grade: string

	constructor(id: string, email: string) {
		this.id = id
		this.email = email
	}

	hasCompleteProfile() {
		return this.department && this.profession && this.grade
	}
}
