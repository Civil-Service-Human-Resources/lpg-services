import * as config from 'lib/config'
import * as datetime from 'lib/datetime'
import * as learnerRecord from 'lib/learnerrecord'

export class Course {
	static create(data: any) {
		const course = new Course(data.id)
		course.description = data.description
		course.duration = data.duration
		course.learningOutcomes = data.learningOutcomes
		course.price = data.price
		course.shortDescription = data.shortDescription
		course.title = data.title

		course.modules = (data.modules || []).map(Module.create)

		return course
	}

	id: string
	title: string
	shortDescription: string
	description: string
	learningOutcomes: string
	duration: number
	price: number

	modules: Module[]

	record?: learnerRecord.LearnerRecord

	constructor(id: string) {
		this.id = id
	}

	getActivityId() {
		return `${config.XAPI.courseBaseUri}/${this.id}`
	}

	getAreasOfWork() {
		return this.modules
			.map(module => module.audiences)
			.reduce((p, c) => p.concat(c))
			.map(audience => audience.areasOfWork)
			.reduce((p, c) => p.concat(c))
			.filter((v, i, a) => a.indexOf(v) === i)
	}

	getDuration() {
		return datetime.formatCourseDuration(this.duration)
	}

	getGrades() {
		return this.modules
			.map(module => module.audiences)
			.reduce((p, c) => p.concat(c))
			.map(audience => audience.grades)
			.reduce((p, c) => p.concat(c))
			.filter((v, i, a) => a.indexOf(v) === i)
	}

	getSelectedDate() {
		if (this.record && this.record.eventId) {
			for (const module of this.modules) {
				const event = module.getEvent(this.record.eventId)
				if (event) {
					return event.date
				}
			}
		}
		return null
	}

	getType() {
		if (!this.modules.length) {
			return null
		}
		if (this.modules.length > 1) {
			return 'blended'
		}
		return this.modules[0].type
	}

	isRequired(user: User) {
		return this.modules.find(module => module.isRequired(user)) != null
	}

	nextRequiredBy(user: User) {
		let next = null
		const completionDate = this.getCompletionDate()
		for (const module of this.modules) {
			const moduleNext = module.nextRequiredBy(user, completionDate)
			if (!next) {
				next = moduleNext
			} else if (moduleNext && moduleNext.getTime() < next.getTime()) {
				next = moduleNext
			}
		}
		return next
	}

	getCompletionDate() {
		return this.record ? this.record.completionDate : undefined
	}

	shouldRepeat(user: User) {
		const completionDate = this.getCompletionDate()
		for (const module of this.modules) {
			const moduleShouldRepeat = module.shouldRepeat(user, completionDate)
			if (moduleShouldRepeat) {
				return true
			}
		}
		return false
	}
}

export class Module {
	static create(data: any) {
		const module = new Module(data.id, data.type)
		module.duration = data.duration
		module.price = data.price
		module.productCode = data.productCode
		module.location = data.location
		module.startPage = data.startPage
		module.title = data.title

		module.audiences = (data.audiences || []).map(Audience.create)
		module.events = (data.events || []).map(Event.create)

		return module
	}

	id: string
	type: string

	title: string
	duration: number

	location?: string
	price?: string
	productCode?: string
	startPage?: string

	audiences: Audience[]
	events: Event[]

	constructor(id: string, type: string) {
		this.id = id
		this.type = type
	}

	getActivityId() {
		return `${config.XAPI.moduleBaseUri}/${this.id}`
	}

	getAudience(user: User) {
		let matchedAudience = null
		let matchedRelevance = -1
		for (const audience of this.audiences) {
			const relevance = audience.getRelevance(user)
			if (relevance > matchedRelevance) {
				matchedAudience = audience
				matchedRelevance = relevance
			}
		}
		return matchedAudience
	}

	getEvent(eventId: string) {
		return this.events.find(event => event.id === eventId)
	}

	isRequired(user: User) {
		const audience = this.getAudience(user)
		if (audience) {
			return audience.mandatory
		}
		return false
	}

	nextRequiredBy(user: User, completionDate?: Date) {
		const audience = this.getAudience(user)
		if (!audience) {
			return null
		}
		return audience.nextRequiredBy(completionDate)
	}

	shouldRepeat(user: User, completionDate?: Date) {
		const audience = this.getAudience(user)
		if (!audience) {
			return false
		}
		return audience.shouldRepeat(completionDate)
	}
}

export class Event {
	static create(data: any) {
		const date = new Date(data.date)
		return new Event(data.id, date, data.location)
	}

	id: string
	date: Date
	location: string

	constructor(id: string, date: Date, location: string) {
		this.id = id
		this.date = date
		this.location = location
	}

	getActivityId() {
		return `${config.XAPI.eventBaseUri}/${this.id}`
	}
}

export class Audience {
	static create(data: any) {
		const audience = new Audience()
		audience.areasOfWork = data.areasOfWork || []
		audience.departments = data.departments || []
		audience.grades = data.grades || []
		audience.mandatory = data.mandatory || false
		audience.frequency = data.frequency
		if (data.requiredBy) {
			audience.requiredBy = new Date(data.requiredBy)
		}
		return audience
	}

	areasOfWork: string[]
	departments: string[]
	grades: string[]
	mandatory: boolean

	requiredBy?: Date | null
	frequency?: string

	getRelevance(user: User) {
		let relevance = -1

		if (this.areasOfWork.indexOf(user.profession)) {
			relevance += 1
		}
		if (this.departments.indexOf(user.department)) {
			relevance += 1
		}
		if (this.grades.indexOf(user.grade)) {
			relevance += 1
		}
		return relevance
	}

	nextRequiredBy(completionDate?: Date) {
		const [last, next] = this._getCurrentRecurrencePeriod()
		if (!last || !next) {
			return null
		}
		if (completionDate && completionDate > last) {
			if (!this.frequency) {
				return null
			}
			return Frequency.increment(this.frequency, next)
		}
		return next
	}

	shouldRepeat(completionDate?: Date) {
		const [last, next] = this._getCurrentRecurrencePeriod()
		if (!last || !next) {
			return !completionDate
		}
		if (!completionDate) {
			return true
		}
		return completionDate < last
	}

	_getCurrentRecurrencePeriod() {
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
	static FiveYearly: 'FIVE_YEARLY'
	static ThreeYearly: 'THREE_YEARLY'
	static Yearly: 'YEARLY'

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
	readonly id: string
	title: string
	searchText: string
	weight: number

	constructor(id: string) {
		this.id = id
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
