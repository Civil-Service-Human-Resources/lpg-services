import * as config from 'lib/config'
import * as datetime from 'lib/datetime'
import * as learnerRecord from 'lib/learnerrecord'

export class Course {
	static create(data: any) {
		const course = new Course(data.id)
		course.description = data.description
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
	duration: number
	learningOutcomes: string
	price: number

	modules: Module[]

	record?: learnerRecord.CourseRecord

	constructor(id: string) {
		this.id = id
	}

	isComplete(user: User) {
		if (this.record) {
			const modules = this.getModules(user)
			for (const module of modules) {
				const moduleRecord = this.record.modules.find(
					mr => mr.moduleId === module.id
				)
				if (!moduleRecord || moduleRecord.state !== 'COMPLETED') {
					return false
				}
			}
			return true
		}
		return false
	}

	hasPreference() {
		return this.record && this.record.preference
	}

	getModules(user: User) {
		const modules = []
		for (const module of this.modules) {
			if (module.getAudience(user) !== null) {
				modules.push(module)
			}
		}
		return modules
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

	getCost() {
		return this.modules
			.map(module => module.price)
			.reduce((p, c) => (p || 0) + (c || 0))
	}

	getDuration() {
		return datetime.formatCourseDuration(
			this.modules.map(m => m.duration).reduce((p, c) => p + c)
		)
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
		if (this.record) {
			const bookedModuleRecord = this.record.modules.find(m => !!m.eventId)
			if (bookedModuleRecord) {
				const bookedModule = this.modules.find(
					m => m.id === bookedModuleRecord.moduleId
				)
				if (bookedModule) {
					const event = bookedModule.getEvent(bookedModuleRecord.eventId!)
					if (event) {
						return event.date
					}
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
		const completionDate = this.getCompletionDate(user)
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

	getCompletionDate(user: User) {
		if (this.isComplete(user)) {
			let completionDate: Date | undefined
			for (const moduleRecord of this.record!.modules) {
				if (!completionDate) {
					completionDate = moduleRecord.completionDate
				} else if (
					moduleRecord.completionDate &&
					moduleRecord.completionDate > completionDate
				) {
					completionDate = moduleRecord.completionDate
				}
			}
			return completionDate
		}
		return undefined
	}

	shouldRepeat(user: User) {
		const completionDate = this.getCompletionDate(user)
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
	price?: number
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

	getDuration() {
		return datetime.formatCourseDuration(this.duration)
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
		const date = data.date ? new Date(data.date) : new Date()
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

		if (
			user.areasOfWork &&
			this.areasOfWork.filter(
				areaOfWork => user.areasOfWork!.indexOf(areaOfWork) > -1
			).length
		) {
			relevance += 1
		}
		if (user.department && this.departments.indexOf(user.department)) {
			relevance += 1
		}
		if (user.grade && this.grades.indexOf(user.grade)) {
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

export class Feedback {
	id: string
	courseId: string
	moduleId: string
	userId: string

	comments: string
	content: number
	interactivity: number
	presentation: number
	relevance: number
}

export class User {
	static create(data: any) {
		const user = new User(
			data.id,
			data.emailAddress,
			data.nameID,
			data.nameIDFormat,
			data.sessionIndex,
			Array.isArray(data.roles) ? data.roles : [data.roles]
		)
		user.department = data.department
		user.givenName = data.givenName
		user.grade = data.grade

		const areasOfWork = data.profession || data.areasOfWork
		if (areasOfWork) {
			user.areasOfWork = Array.isArray(areasOfWork)
				? areasOfWork
				: areasOfWork.split(',')
		} else {
			user.areasOfWork = []
		}

		return user
	}

	readonly id: string
	readonly emailAddress: string
	readonly nameID: string
	readonly nameIDFormat: string
	readonly sessionIndex: string
	readonly roles: string[]

	department?: string
	areasOfWork?: string[]
	givenName?: string
	grade?: string

	constructor(
		id: string,
		emailAddress: string,
		nameID: string,
		nameIDFormat: string,
		sessionIndex: string,
		roles: string[]
	) {
		this.id = id
		this.emailAddress = emailAddress
		this.nameID = nameID
		this.nameIDFormat = nameIDFormat
		this.sessionIndex = sessionIndex
		this.roles = roles
	}

	hasCompleteProfile() {
		return this.department && this.areasOfWork && this.grade
	}

	hasRole(role: string) {
		return this.roles && this.roles.indexOf(role) > -1
	}
}
