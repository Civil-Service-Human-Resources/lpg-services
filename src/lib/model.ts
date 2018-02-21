export const Frequency = {
	FiveYearly: 'five-yearly',
	ThreeYearly: 'two-yearly',
	Yearly: 'yearly',
}

export class textSearchResult {
	public readonly uid: string
	public title: string
	public searchText: string
	public weight: number

	constructor(uid: string) {
		this.uid = uid
	}
}

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

	public availability?: Date[]
	public location?: string
	public price?: string

	public requiredBy?: Date
	public frequency?: string

	public completionDate?: string
	public result?: any
	public score?: string
	public state?: string

	constructor(uid: string, type: string) {
		this.uid = uid
		this.type = type
	}

	isRequired(user: User) {
		return (
			this.tags.indexOf('mandatory:all') > -1 ||
			this.tags.indexOf(`mandatory:${user.department}`) > -1
		)
	}

	static create(data: any) {
		const course = new Course(data.uid, data.type)
		course.availability = data.availability
		course.description = data.description
		course.duration = data.duration
		course.frequency = data.frequency
		course.learningOutcomes = data.learningOutcomes
		course.location = data.location
		course.price = data.price
		course.requiredBy = data.requiredBy
		course.shortDescription = data.shortDescription
		course.tags = data.tags
		course.title = data.title
		course.uri = data.uri
		course.location = data.location
		course.price = data.price
		course.frequency = data.frequency
		course.requiredBy = data.requiredBy
		return course
	}
}

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
