export class Course {
	readonly uid: string
	readonly type: string
	public title: string
	public tags: string[]
	public uri: string
	public shortDescription: string
	public description: string
	public learningOutcomes: string
	public duration: string

	constructor(uid: string, type: string) {
		this.uid = uid
		this.type = type
	}
}

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
