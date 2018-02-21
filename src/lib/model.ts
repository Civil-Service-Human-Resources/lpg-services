export class Frequency {
	static FiveYearly: 'five-yearly'
	static ThreeYearly: 'two-yearly'
	static Yearly: 'yearly'

	static increment(frequency: string, date: Date) {
		const step = this.getStep(frequency)
		return new Date(date.getFullYear() + step, date.getMonth(), date.getDate())
	}

	static decrement(frequency: string, date: Date) {
		const step = this.getStep(frequency)
		return new Date(date.getFullYear() - step, date.getMonth(), date.getDate())
	}

	private static getStep(frequency: string) {
		switch (frequency) {
			case Frequency.FiveYearly:
				return 5
			case Frequency.ThreeYearly:
				return 3
			default:
				return 1
		}
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

	public completionDate?: Date
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

	nextRequiredBy() {
		if (!this.requiredBy || !this.frequency) {
			return null
		}
		const today = new Date()
		let nextDate = this.requiredBy
		while (nextDate < today) {
			nextDate = Frequency.increment(this.frequency, nextDate)
		}
		return nextDate
	}

	shouldRepeat() {
		if (this.frequency) {
			if (!this.completionDate) {
				return true
			}
			const nextDate = this.nextRequiredBy()
			const lastDate = Frequency.decrement(this.frequency, nextDate)
			return this.completionDate < lastDate
		}
		return false
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
