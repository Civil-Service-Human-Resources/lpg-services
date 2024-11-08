import {Type} from 'class-transformer'
import * as datetime from 'lib/datetime'
import * as learnerRecord from 'lib/learnerrecord'
import {AreaOfWork, Grade, Interest, Profile} from 'lib/registry'
import {IdentityDetails} from 'lib/service/identity/models/identityDetails'
import {CourseRecord} from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from 'lib/service/learnerRecordAPI/models/record'
import {ModuleRecord} from 'lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'
import {CacheableObject} from 'lib/utils/cacheableObject'
import {KeyValue} from 'lib/utils/dataUtils'
import * as moment from 'moment'
import {Duration} from 'moment'
import 'reflect-metadata'

import _ = require('lodash')
import {ModuleNotFoundError} from './exception/moduleNotFound'

export interface LineManager {
	email: string
	name?: string
}

const getAudienceForCourse = async (
	audiences: Audience[], user: User,
	depHierarchy: string[]) => {
	let matchedAudience
	let matchedRelevance = -1
	let matchedHighPriorityAudience
	let matchedHighestPriorityAudience

	for await (const audience of audiences) {
		//Get the relevance of each audience
		const relevance = await audience.getRelevance(user!, depHierarchy)

		//If the relevance of the audience is same or more then the previous audience
		//then keep processing the further audiences in the course to get the highest relevance audience
		if (relevance >= matchedRelevance) {
			if (relevance === 4) {
				if (
					(matchedHighestPriorityAudience && audience.requiredBy! < matchedHighestPriorityAudience.requiredBy!) ||
					!matchedHighestPriorityAudience
				) {
					audience.mandatory = true
					matchedAudience = audience
					matchedHighestPriorityAudience = audience
					matchedRelevance = 4
				}
			} else if (relevance === 3) {
				if (
					(matchedHighPriorityAudience && audience.requiredBy! < matchedHighPriorityAudience.requiredBy!) ||
					!matchedHighPriorityAudience
				) {
					audience.mandatory = true
					matchedAudience = audience
					matchedHighPriorityAudience = audience
					matchedRelevance = 3
				}
			} else {
				audience.mandatory = false
				matchedAudience = audience
				matchedRelevance = relevance
			}
		}
	}

	return matchedAudience
}

export class CourseFactory {
	static async create(data: any, user?: User, usersOrganisationHierarchy?: string[]) {
		const course = new Course(data.id)
		course.description = data.description
		course.learningOutcomes = data.learningOutcomes
		course.shortDescription = data.shortDescription
		course.title = data.title
		course.status = data.status

		course.modules = (data.modules || []).map(Module.create)

		const audiences: Audience[] = (data.audiences || []).map(Audience.create)
		course.audiences = audiences

		if (user && usersOrganisationHierarchy) {
			course.audience = await getAudienceForCourse(audiences, user, usersOrganisationHierarchy)
		}

		return course
	}
}

export class Course {
	static create(data: any, user?: User) {
		const course = new Course(data.id)
		course.description = data.description
		course.learningOutcomes = data.learningOutcomes
		course.shortDescription = data.shortDescription
		course.title = data.title
		course.status = data.status

		course.modules = (data.modules || []).map(Module.create)

		const audiences = (data.audiences || []).map(Audience.create)
		course.audiences = audiences

		if (user) {
			let matchedAudience = null
			let matchedRelevance = -1
			let audienceWithRelevanceThree = null
			let audienceWithRelevanceTwo = null
			let audienceWithRelevanceOne = null
			let minRequiredByAudienceWithRelevanceThree = null
			let minRequiredByAudienceWithRelevanceTwo = null
			let minRequiredByAudienceWithRelevanceOne = null
			for (const audience of audiences) {
				//Get the relevance of each audience
				const relevance = audience.getRelevance(user!, [])
				//If the relevance of the audience is same or more then the previous audience
				//then keep processing the further audiences in the course to get the highest relevance audience
				if (relevance >= matchedRelevance) {
					matchedAudience = audience
					matchedRelevance = relevance
					//audience with relevance 3 will have the required by date
					//and the audience with relevance 2 and 1 can also have the required by date
					//and if multiple audiences are found within the relevance 3 or 2 or 1
					//then the audience which has earliest due date within the same relevance need to be selected
					//to keep it in sync with the backend code which fetches the mandatory course for homepage
					if (relevance === 3) {
						if (minRequiredByAudienceWithRelevanceThree == null) {
							minRequiredByAudienceWithRelevanceThree = audience
						}
						if (audience.requiredBy < minRequiredByAudienceWithRelevanceThree.requiredBy) {
							minRequiredByAudienceWithRelevanceThree = audience
						}
						audienceWithRelevanceThree = minRequiredByAudienceWithRelevanceThree
					}
					if (relevance === 2) {
						if (minRequiredByAudienceWithRelevanceTwo == null) {
							minRequiredByAudienceWithRelevanceTwo = audience
						}
						if (audience.requiredBy < minRequiredByAudienceWithRelevanceTwo.requiredBy) {
							minRequiredByAudienceWithRelevanceTwo = audience
						}
						audienceWithRelevanceTwo = minRequiredByAudienceWithRelevanceTwo
					}
					if (relevance === 1) {
						if (minRequiredByAudienceWithRelevanceOne == null) {
							minRequiredByAudienceWithRelevanceOne = audience
						}
						if (audience.requiredBy < minRequiredByAudienceWithRelevanceOne.requiredBy) {
							minRequiredByAudienceWithRelevanceOne = audience
						}
						audienceWithRelevanceOne = minRequiredByAudienceWithRelevanceOne
					}
				}
			}

			//if the audiences with relevance 1, 2 and 3 are found
			//then matchedAudience will be of the highest priority of relevance
			//i.e. relevance 3 then 2 then 1
			if (audienceWithRelevanceOne) {
				matchedAudience = audienceWithRelevanceOne
			}
			if (audienceWithRelevanceTwo) {
				matchedAudience = audienceWithRelevanceTwo
			}
			if (audienceWithRelevanceThree) {
				matchedAudience = audienceWithRelevanceThree
			}

			course.audience = matchedAudience

			if (course.audience) {
				course.audience.mandatory = false
				course.audience.departments.forEach(a => {
					if (a === user.getOrganisationCode() && course.audience!.type === 'REQUIRED_LEARNING') {
						course.audience!.mandatory = true
					}
				})
			}
		}

		return course
	}

	id: string
	title: string
	shortDescription: string
	description: string
	duration: number
	learningOutcomes: string
	status: string

	modules: Module[]

	audiences: Audience[]
	audience?: Audience

	record?: learnerRecord.CourseRcd

	constructor(id: string) {
		this.id = id
	}

	getRequiredRecurringAudience() {
		if (this.audience && this.audience.frequency && this.audience.requiredBy) {
			const nextDate = moment(this.audience.requiredBy).endOf("day").utc()
			while (nextDate < moment().utc()) {
				nextDate.add({
					months: this.audience.frequency.months(),
					years: this.audience.frequency.years(),
				})
			}
			const lastDate = moment(nextDate).endOf("day").utc()
			lastDate.subtract({
				months: this.audience.frequency.months(),
				years: this.audience.frequency.years(),
			})
			return new RequiredRecurringAudience(lastDate.toDate(), nextDate.toDate())
		} else {
			return null
		}
	}

	isArchived() {
		return this.status ? this.status === 'Archived' : false
	}

	isComplete() {
		return this.record ? this.record!.state === 'COMPLETED' : false
	}

	isStarted() {
		return this.record ? this.record!.state === 'IN_PROGRESS' : false
	}

	hasPreference() {
		return this.record && this.record.preference
	}

	getModules() {
		return this.modules
	}

	public getModulesRequiredForCompletion() {
		const optModules: Module[] = []
		const requiredModules: Module[] = []
		this.modules.forEach(m => {
			m.optional ? optModules.push(m) : requiredModules.push(m)
		})
		return requiredModules.length > 0 ? requiredModules : optModules
	}

	public getDisplayState(courseRecord: CourseRecord): RecordState {
		const requiredModuleIdsForCompletion = this.getModulesRequiredForCompletion()
			.map(m => m.id)
		const moduleRecordMap = courseRecord.getModuleRecordMap()
		const audience = this.getRequiredRecurringAudience()
		let inProgressCount = 0
		let requiredCompletedCount = 0
		for (const module of this.modules) {
			const state = module.getDisplayState(moduleRecordMap.get(module.id), audience)

			if (state === 'COMPLETED') {
				if (requiredModuleIdsForCompletion.includes(module.id)) {
					requiredCompletedCount ++
				} else {
					inProgressCount ++
				}
			} else if (state === 'IN_PROGRESS') {
				inProgressCount ++
			}
		}

		if (requiredCompletedCount === requiredModuleIdsForCompletion.length) {
			return RecordState.Completed
		} else if (inProgressCount > 0 || requiredCompletedCount > 0) {
			return RecordState.InProgress
		}
		return RecordState.Null
	}

	public getDisplayStateForModules(courseRecord: CourseRecord): Map<string, string | null> {
		const results = new Map<string, string | null>()
		const moduleRecords = courseRecord.getModuleRecordMap()
		const audience = this.getRequiredRecurringAudience()
		this.modules.forEach(m => {
			const moduleRecord = moduleRecords.get(m.id)
			results.set(m.id, m.getDisplayState(moduleRecord, audience))
		})
		return results
	}

	getRequiredModules() {
		return this.getModules().filter(m => !m.optional)
	}

	getOptionalModules() {
		return this.getModules().filter(m => m.optional)
	}

	isAssociatedLearningModule(id: number) {
		return this.modules[id].associatedLearning
	}

	getAreasOfWork() {
		return this.audience ? this.audience.areasOfWork : []
	}

	getCost() {
		const costArray = this.modules.map(module => module.cost || 0)
		return costArray.length ? costArray.reduce((p, c) => p + c, 0) : null
	}

	getDuration() {
		const durationArray = this.modules.map(m => m.duration)

		// tslint:disable-next-line:only-arrow-functions
		this.modules.forEach(function(module, i) {
			if (module.type === "face-to-face") {
				if (module.events && module.events.length > 0) {
					const event = module.events[0]
					let durationInSeconds = 0
					if (event.dateRanges) {
						event.dateRanges.forEach(dateRange => {
							const tempStartDate = new Date()
							const startTimeInHours = _.get(dateRange, 'startTime', 0).split(':')[0]
							const startTimeInMinutes = _.get(dateRange, 'startTime', 0).split(':')[1]
							const startTimeInSeconds = _.get(dateRange, 'startTime', 0).split(':')[2]
							tempStartDate.setHours(startTimeInHours, startTimeInMinutes, startTimeInSeconds)
							const startTimeHoursInMinutes = tempStartDate.getHours() * 60 + tempStartDate.getMinutes()

							const tempEndDate = new Date()
							const endTimeInHours = _.get(dateRange, 'endTime', 0).split(':')[0]
							const endTimeInMinutes = _.get(dateRange, 'endTime', 0).split(':')[1]
							const endTimeInSeconds = _.get(dateRange, 'endTime', 0).split(':')[2]
							tempEndDate.setHours(endTimeInHours, endTimeInMinutes, endTimeInSeconds)
							const endTimeHoursInMinutes = tempEndDate.getHours() * 60 + tempEndDate.getMinutes()

							const durationInMinutes = endTimeHoursInMinutes - startTimeHoursInMinutes
							durationInSeconds += durationInMinutes * 60

							durationArray[i] = durationInSeconds
						})
					}
				}
			}
		})

		let totalDuration = 0
		// tslint:disable-next-line:prefer-for-of
		for (let i = 0; i < durationArray.length; i++) {
			totalDuration += durationArray[i]
		}

		if (durationArray.length > 0) {
			return datetime.formatCourseDuration(Number(totalDuration))
		}
		return '0 minutes'
	}

	getGrades() {
		return this.audience ? this.audience.grades : []
	}

	canBeBooked() {
		return this.modules.filter(m => m.canBeBooked()).length > 0
	}

	hasBookableEvents() {
		return this.modules.flatMap(m => m.getBookableEvents()).length > 0
	}

	getSelectedDate() {
		if (this.record) {
			const bookedModuleRecord = this.record.modules.find(m => !!m.eventId && m.state !== 'SKIPPED')
			if (bookedModuleRecord) {
				const bookedModule = this.modules.find(m => m.id === bookedModuleRecord.moduleId)
				if (bookedModule) {
					const event = bookedModule.getEvent(bookedModuleRecord.eventId!)
					if (event) {
						return event.startDate
					}
				}
			}
		}
		return null
	}

	getDateRanges() {
		if (this.record) {
			const bookedModuleRecord = this.record.modules.find(m => !!m.eventId && m.state !== 'SKIPPED')
			if (bookedModuleRecord) {
				const bookedModule = this.modules.find(m => m.id === bookedModuleRecord.moduleId)
				if (bookedModule) {
					const event = bookedModule.getEvent(bookedModuleRecord.eventId!)
					if (event) {
						return event.dateRanges.sort(function compare(a, b) {
							const dateA = new Date(_.get(a, 'date', ''))
							const dateB = new Date(_.get(b, 'date', ''))
							// @ts-ignore
							return dateA - dateB
						})
					}
				}
			}
		}
		return null
	}

	getType() {
		if (!this.modules.length) {
			return 'unknown'
		}
		if (this.modules.length > 1) {
			return 'blended'
		}
		return this.modules[0].type
	}

	isRequired() {
		return this.audience ? this.audience.mandatory : false
	}

	getDueByDateDisplayString() {
		let resp: string | undefined
		const dueByDate = this.getDueByDate()
		if (dueByDate !== null) {
			resp = moment(dueByDate).utc().format("DD MMM YYYY")
		}
		return resp
	}

	getDueByDate() {
		let dueByDate: Date | null = null
		if (this.audience) {
			const requiredAudience = this.getRequiredRecurringAudience()
			if (requiredAudience) {
				dueByDate = requiredAudience.nextRequiredBy
			} else {
				if (this.audience.requiredBy) {
					dueByDate = this.audience.requiredBy
				}
			}
		}
		return dueByDate
	}

	//LC-1054: Rather than updating the above method a new method is Implemented as below
	previousRequiredByNew() {
		if (this.audience) {
			return this.audience!.previousRequiredByNew()
		}
		return null
	}

	getMandatoryCount() {
		const modules = this.getModules()
		let count = 0
		modules.forEach(module => {
			if (!module.optional) {
				count++
			}
		})

		return count
	}

	getCompletionDate() {
		if (this.isComplete()) {
			let completionDate: Date | undefined
			for (const moduleRecord of this.record!.modules) {
				if (!completionDate) {
					completionDate = moduleRecord.completionDate
				} else if (moduleRecord.completionDate && moduleRecord.completionDate > completionDate) {
					completionDate = moduleRecord.completionDate
				}
			}
			return completionDate
		}
		return undefined
	}

	getModule(moduleId: string) {
		const module = this.modules.find(m => m.id === moduleId)
		if (!module) {
			throw new ModuleNotFoundError(this.id, moduleId)
		}
		return module
	}

	hasModules() {
		return (this.modules || []).length > 0
	}
}

export class CourseModule {
	static createFromCourse(course: Course) {
		const courseModule = new CourseModule()
		courseModule.course = course
		courseModule.type = 'course'
		return courseModule
	}

	course: Course
	module: Module
	type: string
}

export class Module {
	static create(data: any) {
		const module = new Module(data.id, data.type)
		module.duration = data.duration
		module.cost = data.cost
		module.productCode = data.productCode
		module.startPage = data.startPage
		module.title = data.title
		module.description = data.description
		module.url = data.url
		module.location = data.location
		module.fileSize = data.fileSize
		module.optional = data.optional || false
		module.events = (data.events || []).map(Event.create)
		sortEvents(module.events)
		module.associatedLearning = data.associatedLearning

		return module
	}

	id: string
	type: string

	title: string
	description: string

	duration: number
	optional = false
	associatedLearning = false
	url?: string
	location?: string
	fileSize?: number
	cost?: number
	productCode?: string
	startPage?: string

	events: Event[]

	constructor(id: string, type: string) {
		this.id = id
		this.type = type
	}

	getDuration() {
		if (this.type === 'face-to-face') {
			if (this.events && this.events.length > 0) {
				const startTimeHours = this.events[0].startDate.getHours()
				const startTimeHoursInMinutes = startTimeHours * 60 + this.events[0].startDate.getMinutes()
				const endTimeHours = this.events[0].endDate.getHours()
				const endTimeHoursInMinutes = endTimeHours * 60 + this.events[0].endDate.getMinutes()
				const durationInMinutes = endTimeHoursInMinutes - startTimeHoursInMinutes
				const durationInSeconds = durationInMinutes * 60
				this.duration = durationInSeconds
			}
		}

		if (this.type === 'face-to-face') {
			if (this.events && this.events.length > 0) {
				sortEvents(this.events)
				const event = this.events[0]
				let durationInSeconds = 0

				event.dateRanges.forEach(dateRange => {
					const tempStartDate = new Date()
					const startTimeInHours = _.get(dateRange, 'startTime', 0).split(':')[0]
					const startTimeInMinutes = _.get(dateRange, 'startTime', 0).split(':')[1]
					const startTimeInSeconds = _.get(dateRange, 'startTime', 0).split(':')[2]
					tempStartDate.setHours(startTimeInHours, startTimeInMinutes, startTimeInSeconds)
					const startTimeHoursInMinutes = tempStartDate.getHours() * 60 + tempStartDate.getMinutes()

					const tempEndDate = new Date()
					const endTimeInHours = _.get(dateRange, 'endTime', 0).split(':')[0]
					const endTimeInMinutes = _.get(dateRange, 'endTime', 0).split(':')[1]
					const endTimeInSeconds = _.get(dateRange, 'endTime', 0).split(':')[2]
					tempEndDate.setHours(endTimeInHours, endTimeInMinutes, endTimeInSeconds)
					const endTimeHoursInMinutes = tempEndDate.getHours() * 60 + tempEndDate.getMinutes()

					const durationInMinutes = endTimeHoursInMinutes - startTimeHoursInMinutes
					durationInSeconds += durationInMinutes * 60
				})
				// tslint:disable-next-line:indent
				this.duration = durationInSeconds
			}
		}

		if (!this.duration) {
			return '0 minutes'
		}
		return datetime.formatCourseDuration(this.duration)
	}

	getEvent(eventId: string) {
		return this.events.find(event => event.id === eventId)
	}

	canBeBooked() {
		return this.getBookableEvents().length > 0
	}

	getBookableEvents(): Event[] {
		return this.events.filter(e => e.isBookable())
	}

	isAssociatedLearning() {
		return this.associatedLearning
	}

	getDisplayState(
		moduleRecord: ModuleRecord | undefined | null,
		audience: RequiredRecurringAudience | undefined | null) {
		let state: string | null = null
		if (moduleRecord) {
			const completionDate = moduleRecord.getCompletionDate().getTime()
			const updatedAt = moduleRecord.getUpdatedAt().getTime()
			const previousRequiredBy = audience ? audience.previousRequiredBy.getTime() : new Date(0).getTime()
			if (previousRequiredBy < completionDate) {
				state = 'COMPLETED'
			} else if (previousRequiredBy < updatedAt) {
				state = 'IN_PROGRESS'
			}
		}
		return state
	}
}

export class ModuleWithCourse extends Module {
	courseId?: string
	course?: Course
}
export class Event {
	static create(data: any) {
		// TODO: Matt - this is a temp work around to circumvent new event definition not matching UI
		let startDate: any = ''
		let endDate: any = ''
		let dateRanges: any = ''

		if (data.dateRanges[0]) {
			dateRanges = data.dateRanges
			startDate = new Date(data.dateRanges[0].date + 'T' + data.dateRanges[0].startTime)
			endDate = new Date(data.dateRanges[0].date + 'T' + data.dateRanges[0].endTime)
		}

		let location = ''
		let capacity = 0
		let availability = 0
		if (data.venue) {
			location = data.venue.location
			capacity = data.venue.capacity
			availability = data.venue.availability
		} else {
			location = data.location
			capacity = data.capacity
		}

		const status = data.status ? data.status : 'Active'

		return new Event(startDate, endDate, dateRanges, location, capacity, availability, status, data.id)
	}

	public isLearnerBooked?: boolean

	constructor(
		public startDate: Date,
		public endDate: Date,
		public dateRanges: Date[],
		public location: string,
		public capacity: number,
		public availability: number,
		public status: string,
		public id: string
	) { }

	isBookable() {
		return this.startDate > new Date()
	}
}

export class Audience {
	static create(data: any) {
		const audience = new Audience()
		audience.areasOfWork = data.areasOfWork || []
		audience.departments = data.departments || []
		audience.grades = data.grades || []
		audience.interests = data.interests || []
		audience.mandatory = data.mandatory === undefined ? true : data.mandatory
		audience.frequency = data.frequency ? moment.duration(data.frequency) : undefined
		audience.type = data.type ? data.type.toString() : null
		if (data.requiredBy) {
			audience.requiredBy = new Date(data.requiredBy)
		}
		return audience
	}

	areasOfWork: string[]
	departments: string[]
	grades: string[]
	interests: string[]
	mandatory = false
	requiredBy?: Date | null
	frequency?: Duration
	type: string

	get optional() {
		return !this.mandatory
	}

	set optional(value: boolean | string) {
		this.mandatory = !value || value === 'false'
	}

	async getRelevance(user: User, depHierarchy: string[]): Promise<number> {
		let relevance = -1

		if (!(this.areasOfWork.length || this.departments.length || this.grades.length)) {
			return 0
		}

		const areaOfWork = user.areaOfWork
		if (areaOfWork !== undefined) {
			if (this.areasOfWork.filter(aow => areaOfWork.name === aow).length > 0) {
				relevance += 1
			}
		}
		let depScore = 0
		for (const department of this.departments) {
			const depIndex = depHierarchy.indexOf(department)
			if (depIndex > -1) {
				depScore = 1
				if (this.requiredBy) {
					// 4 = mandatory for the user's immediate dep
					if (depIndex === 0) {
						return 4
					}
					// 3 = mandatory for the user's parent/gparent dep
					return 3
				}
			}
		}
		relevance += depScore

		if (user.grade && this.grades.indexOf(user.grade.code) > -1) {
			relevance += 1
		}
		return relevance
	}

	previousRequiredBy(completionDate?: Date) {
		const [last, next] = this._getCurrentRecurrencePeriod()
		if (!last || !next) {
			return null
		}
		if (completionDate && completionDate > last) {
			if (!this.frequency) {
				return null
			}
			return Frequency.decrement(this.frequency, next)
		}
		return last
	}

	//LC-1054: Rather than updating the above method a new method is Implemented as below
	previousRequiredByNew() {
		const [last, next] = this._getCurrentRecurrencePeriodNew()
		if (!last && !next) {
			return null
		}
		return last
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

	//LC-1054: Rather than updating the above method a new method is Implemented as below
	_getCurrentRecurrencePeriodNew() {
		if (!this.requiredBy) {
			return [null, null]
		}
		const today = new Date(new Date().toDateString())
		let nextDate = new Date(this.requiredBy.toDateString())

		if (!this.frequency) {
			if (nextDate < today) {
				return [nextDate, nextDate]
			} else {
				return [null, nextDate]
			}
		}
		while (nextDate < today) {
			nextDate = Frequency.increment(this.frequency, nextDate)
		}
		const lastDate = Frequency.decrement(this.frequency, nextDate)
		return [lastDate, nextDate]
	}
}

export class RequiredRecurringAudience {
	constructor(public previousRequiredBy: Date, public nextRequiredBy: Date) {
	}
}

export class Frequency {
	static increment(frequency: Duration, date: Date) {
		return new Date(date.getFullYear() + frequency.years(), date.getMonth() + frequency.months(), date.getDate())
	}

	static decrement(frequency: Duration, date: Date) {
		return new Date(date.getFullYear() - frequency.years(), date.getMonth() - frequency.months(), date.getDate())
	}
}

export class AgencyToken {
	token: string
	uid: string
	@Type(() => Domain)
	agencyDomains: Domain[]
}

export class Domain {
	id: string
	domain: string
}

export class OrganisationalUnit implements CacheableObject, KeyValue {
	id: number
	code: string
	name: string
	abbreviation?: string
	@Type(() => OrganisationalUnit)
	parent?: OrganisationalUnit
	parentId: number
	@Type(() => AgencyToken)
	agencyToken: AgencyToken
	formattedName: string
	children: OrganisationalUnit[] = []
	paymentMethods: string[]

	@Type(() => Domain)
	domains: Domain[] = []

	getId(): string {
		return this.id.toString()
	}

	getHierarchyAsArray() {
		const hierarchy: OrganisationalUnit[] = [this]
		let currentParent = this.parent
		while (currentParent) {
			hierarchy.push(currentParent)
			currentParent = currentParent.parent
		}
		return hierarchy
	}

	extractAllOrgs() {
		const orgs: OrganisationalUnit[] = [this]
		if (this.children) {
			for (const child of this.children) {
				orgs.push(...child.extractAllOrgs())
			}
		}
		return orgs
	}

	doesDomainExistInToken(domain: string) {
		let exists = false
		if (this.agencyToken
			&& this.agencyToken.agencyDomains.map(a => a.domain).includes(domain)) {
				exists = true
		}
		return exists
	}

	doesDomainExist(domain: string): boolean {
		return this.domains.find(d => d.domain === domain) !== undefined
	}

	formatNameWithAbbrev(): string {
		return (this.abbreviation && this.abbreviation !== '') ? `${this.name} (${this.abbreviation})` : this.name
	}
}

export interface CSLUser {
	isUnrestrictedOrgUser(): boolean
	isAdmin(): boolean
	isReporter(): boolean
}

export function createUser(identity: IdentityDetails, profile: Profile) {
	const lineManager: LineManager | undefined = (profile.lineManagerName && profile.lineManagerEmailAddress) ?
		{email: profile.lineManagerEmailAddress, name: profile.lineManagerName} : undefined
	return new User(identity.uid, identity.roles, identity.accessToken, identity.username, profile.userId.toString(),
		profile.profession, lineManager, profile.otherAreasOfWork, profile.interests, profile.fullName,
		profile.organisationalUnit, profile.grade, profile.managementLoggedIn, profile.managementShouldLogout,
		profile.uiLoggedIn, profile.uiShouldLogout, profile.shouldRefresh)
}

export class User implements CSLUser {

	constructor(
	public readonly id: string,
	public readonly roles: string[],
	public readonly accessToken: string,
	public readonly userName: string,
	public userId: string,
	public areaOfWork?: AreaOfWork,
	public lineManager?: LineManager,
	public otherAreasOfWork?: AreaOfWork[],
	public interests?: Interest[],
	public givenName?: string,
	public organisationalUnit?: OrganisationalUnit,
	public grade?: Grade,
	public managementLoggedIn: boolean = false,
	public managementShouldLogout: boolean = false,
	public uiLoggedIn: boolean = false,
	public uiShouldLogout: boolean = false,
	public shouldRefresh: boolean = false) {
	}

	updateWithProfile(profile: Profile) {
		this.organisationalUnit = profile.organisationalUnit
		this.givenName = profile.fullName
		this.grade = profile.grade
		this.areaOfWork = profile.profession
		this.otherAreasOfWork = profile.otherAreasOfWork
		this.interests = profile.interests
		this.lineManager = profile.getLineManager()
	}

	hasCompleteProfile() {
		return true
	}

	isUnrestrictedOrgUser(): boolean {
		return this.hasRole("UNRESTRICTED_ORGANISATION")
	}

	hasRole(role: string) {
		return this.roles && this.roles.indexOf(role) > -1
	}

	hasAnyRole(roles: string[]) {
		return this.roles && this.roles.some(value => roles.indexOf(value) > -1)
	}

	isReporter(): boolean {
		return this.hasAnyRole(['CSHR_REPORTER', 'PROFESSION_REPORTER', 'ORGANISATION_REPORTER'])
	}

	isAdmin() {
		return (
			this.hasRole('LEARNING_MANAGER') ||
			this.hasRole('CSL_AUTHOR') ||
			this.hasRole('PROFESSION_AUTHOR') ||
			this.hasRole('ORGANISATION_AUTHOR') ||
			this.hasRole('KPMG_SUPPLIER_AUTHOR') ||
			this.hasRole('KORNFERRY_SUPPLIER_AUTHOR') ||
			this.hasRole('KNOWLEDGEPOOL_SUPPLIER_AUTHOR')
		)
	}

	getGradeCode() {
		return this.grade ? this.grade.code : ''
	}

	getGradeId() {
		return this.grade ? this.grade.id : undefined
	}

	getDomain() {
		return this.userName.split('@')[1].toLowerCase()
	}

	getOrganisationCode() {
		return this.organisationalUnit ? this.organisationalUnit.code : undefined
	}

	getAreaOfWorkId() {
		return this.areaOfWork ? this.areaOfWork.id : undefined
	}
}

function sortEvents(events: Event[]) {
	events.sort(function compare(a, b) {
		const dateA = new Date(_.get(a, 'startDate', ''))
		const dateB = new Date(_.get(b, 'startDate', ''))
		// @ts-ignore
		return dateA - dateB
	})
}
