import * as config from 'lib/config'

export class Course {
	static create(data: any) {
		const course = new Course(data.uid, data.type)
		course.availability = ((data.availability as Date[]) || []).map(
			availability => new Date(availability)
		)
		course.description = data.description
		course.duration = data.duration
		course.frequency = data.frequency
		course.learningOutcomes = data.learningOutcomes
		course.location = data.location
		course.price = data.price
		course.productCode = data.productCode
		course.requiredBy = data.requiredBy ? new Date(data.requiredBy) : null
		course.shortDescription = data.shortDescription
		course.tags = data.tags
		course.title = data.title
		course.uri = data.uri
		return course
	}

	uid: string
	type: string

	title: string
	tags: string[]
	uri: string
	shortDescription: string
	description: string
	learningOutcomes: string
	duration: string
	productCode: string

	availability?: Date[]
	location?: string
	price?: string

	requiredBy?: Date | null
	frequency?: string

	completionDate?: Date | null
	result?: any
	score?: string
	preference?: string
	selectedDate?: Date | null
	state?: string

	constructor(uid: string, type: string) {
		this.uid = uid
		this.type = type
	}

	getActivityId() {
		let activityId = this.getParentActivityId()
		if (this.selectedDate) {
			activityId += `/${this.selectedDate.toISOString().slice(0, 10)}`
		}
		return activityId
	}

	getParentActivityId() {
		return `${config.XAPI.activityBaseUri}/${this.uid}`
	}

	isRequired(user: User) {
		return (
			this.tags &&
			(this.tags.indexOf('mandatory:all') > -1 ||
				this.tags.indexOf(`mandatory:${user.department}`) > -1)
		)
	}

	nextRequiredBy() {
		const [last, next] = this._currentRecurrencePeriod()
		if (!last || !next) {
			return null
		}

		if (this.completionDate && this.completionDate > last) {
			if (!this.frequency) {
				throw new Error(`course.frequency not set for course ${this.uid}`)
			}
			return Frequency.increment(this.frequency, next)
		}
		return next
	}

	shouldRepeat() {
		const [last, next] = this._currentRecurrencePeriod()
		if (!last || !next) {
			return !this.completionDate
		}
		if (!this.completionDate) {
			throw new Error(`course.completionDate not set for course ${this.uid}`)
		}
		return this.completionDate < last
	}

	_currentRecurrencePeriod() {
		if (!this.requiredBy || !this.frequency) {
			return [null, null]
		}
		const today = new Date()
		let nextDate = this.requiredBy
		while (nextDate < today) {
			nextDate = Frequency.increment(this.frequency, nextDate)
		}
		const lastDate = Frequency.decrement(this.frequency, nextDate)
		return [lastDate, nextDate]
	}
}

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

export class TextSearchResult {
	readonly uid: string
	title: string
	searchText: string
	weight: number

	constructor(uid: string) {
		this.uid = uid
	}
}

export class User {
	readonly id: string
	readonly emailAddress: string
	readonly nameID: string
	readonly nameIDFormat: string
	readonly sessionIndex: string

	department: string
	profession: string
	givenName: string
	grade: string

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
