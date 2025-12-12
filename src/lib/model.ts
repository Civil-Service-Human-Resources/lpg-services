import * as moment from 'moment'
import {Duration} from 'moment'
import 'reflect-metadata'
import * as datetime from '../lib/datetime'
import {AreaOfWork, Grade, Interest, Profile} from './registry'
import {IdentityDetails} from './service/identity/models/identityDetails'
import {CourseRecord} from './service/cslService/models/courseRecord'
import {RecordState} from './service/cslService/models/record'
import {ModuleRecord} from './service/cslService/models/moduleRecord'
import {CacheableObject} from './utils/cacheableObject'

import _ = require('lodash')

export interface ICourse {
	id: string
}

export interface LineManager {
	email: string
	name?: string
}

const getAudienceForCourse = async (audiences: Audience[], user: User, depHierarchy: string[]) => {
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

export type CourseStatus = 'Published' | 'Archived'

export type CourseType = ModuleType | 'blended' | 'unknown'

export class Course implements ICourse {
	id: string
	title: string
	shortDescription: string
	description: string
	duration: number
	learningOutcomes: string
	status: CourseStatus

	modules: Module[]

	audiences: Audience[]
	audience?: Audience

	record?: CourseRecord

	constructor(id: string) {
		this.id = id
	}

	getRequiredRecurringAudience() {
		if (this.audience && this.audience.frequency && this.audience.requiredBy) {
			const nextDate = moment(this.audience.requiredBy).endOf('day').utc()
			while (nextDate < moment().utc()) {
				nextDate.add({
					months: this.audience.frequency.months(),
					years: this.audience.frequency.years(),
				})
			}
			const lastDate = moment(nextDate).endOf('day').utc()
			lastDate.subtract({
				months: this.audience.frequency.months(),
				years: this.audience.frequency.years(),
			})
			return new RequiredRecurringAudience(lastDate.toDate(), nextDate.toDate())
		} else {
			return null
		}
	}

	getModules() {
		return this.modules
	}

	getModule(moduleId: string) {
		return this.getModules().find(m => m.id === moduleId)
	}

	public getModulesRequiredForCompletion() {
		const optModules: Module[] = []
		const requiredModules: Module[] = []
		this.modules.forEach(m => {
			if (m.optional) {
				optModules.push(m)
			} else {
				requiredModules.push(m)
			}
		})
		return requiredModules.length > 0 ? requiredModules : optModules
	}

	public getDisplayState(courseRecord: CourseRecord): RecordState {
		const requiredModuleIdsForCompletion = this.getModulesRequiredForCompletion().map(m => m.id)
		const moduleRecordMap = courseRecord.getModuleRecordMap()
		const audience = this.getRequiredRecurringAudience()
		let inProgressCount = 0
		let requiredCompletedCount = 0
		for (const module of this.modules) {
			const state = module.getDisplayState(moduleRecordMap.get(module.id), audience)

			if (state === 'COMPLETED') {
				if (requiredModuleIdsForCompletion.includes(module.id)) {
					requiredCompletedCount++
				} else {
					inProgressCount++
				}
			} else if (state === 'IN_PROGRESS') {
				inProgressCount++
			}
		}

		if (requiredCompletedCount === requiredModuleIdsForCompletion.length) {
			return 'COMPLETED'
		} else if (inProgressCount > 0 || requiredCompletedCount > 0) {
			return 'IN_PROGRESS'
		}
		return ''
	}

	getAreasOfWork() {
		return this.audience ? this.audience.areasOfWork : []
	}

	getCost() {
		const costArray = this.modules.map(module => module.cost || 0)
		return costArray.length ? costArray.reduce((p, c) => p + c, 0) : undefined
	}

	getDurationSeconds() {
		const durationArray = this.modules.map(m => m.duration)

		this.modules.forEach((module, i) => {
			if (module.type === 'face-to-face') {
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
		// eslint-disable-next-line typescript-eslint/prefer-for-of
		for (let i = 0; i < durationArray.length; i++) {
			totalDuration += durationArray[i]
		}
		return totalDuration
	}

	getDuration() {
		const getDurationSeconds = this.getDurationSeconds()
		if (getDurationSeconds > 0) {
			return datetime.formatCourseDuration(Number(getDurationSeconds))
		}
		return '0 minutes'
	}

	getGrades() {
		return this.audience ? this.audience.grades : []
	}

	getType(): CourseType {
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
}

export type ModuleType = 'elearning' | 'face-to-face' | 'file' | 'link' | 'video'

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
	type: ModuleType

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

	constructor(id: string, type: ModuleType) {
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
		return (this.events || []).filter(e => e.isBookable())
	}

	getDisplayState(
		moduleRecord: ModuleRecord | undefined | null,
		audience: RequiredRecurringAudience | undefined | null
	) {
		let state: string | null = null
		if (moduleRecord) {
			if (this.type !== 'face-to-face') {
				const completionDate = moduleRecord.getCompletionDate().getTime()
				const updatedAt = moduleRecord.getUpdatedAt().getTime()
				const previousRequiredBy = audience ? audience.previousRequiredBy.getTime() : new Date(0).getTime()
				if (previousRequiredBy < completionDate) {
					state = 'COMPLETED'
				} else if (previousRequiredBy < updatedAt) {
					state = 'IN_PROGRESS'
				}
			} else {
				state = moduleRecord.state ? moduleRecord.state : ''
			}
		}
		return state
	}
}

export type EventStatus = 'Active' | 'Cancelled'

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

		const status = data.status

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
		public status: EventStatus,
		public id: string
	) {}

	isBookable() {
		return this.startDate > new Date() && this.status === 'Active'
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
}

export class RequiredRecurringAudience {
	constructor(
		public previousRequiredBy: Date,
		public nextRequiredBy: Date
	) {}
}

export class OrganisationalUnit implements CacheableObject {
	id: number
	name: string
	code: string
	abbreviation?: string
	parentId?: number
	parentName?: string

	getId(): string {
		return this.id.toString()
	}
}

export interface CSLUser {
	isUnrestrictedOrgUser(): boolean
	isAdmin(): boolean
	isReporter(): boolean
	hasLineManager(): boolean
}

export function createUser(identity: IdentityDetails, profile: Profile) {
	const lineManager: LineManager | undefined =
		profile.lineManagerName && profile.lineManagerEmailAddress
			? {email: profile.lineManagerEmailAddress, name: profile.lineManagerName}
			: undefined
	return new User(
		identity.uid,
		identity.roles,
		identity.accessToken,
		identity.username,
		profile.userId.toString(),
		profile.profession,
		lineManager,
		profile.otherAreasOfWork,
		profile.interests,
		profile.fullName,
		profile.otherOrganisationalUnits,
		profile.organisationalUnit,
		profile.grade,
		profile.managementLoggedIn,
		profile.managementShouldLogout,
		profile.uiLoggedIn,
		profile.uiShouldLogout,
		profile.shouldRefresh
	)
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
		public otherOrganisationalUnits?: OrganisationalUnit[],
		public organisationalUnit?: OrganisationalUnit,
		public grade?: Grade,
		public managementLoggedIn: boolean = false,
		public managementShouldLogout: boolean = false,
		public uiLoggedIn: boolean = false,
		public uiShouldLogout: boolean = false,
		public shouldRefresh: boolean = false
	) {}

	updateWithProfile(profile: Profile) {
		this.organisationalUnit = profile.organisationalUnit
		this.otherOrganisationalUnits = profile.otherOrganisationalUnits
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
		return this.hasRole('UNRESTRICTED_ORGANISATION')
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

	getAllAreasOfWork() {
		const aow = this.otherAreasOfWork || []
		if (this.areaOfWork) {
			aow.push(this.areaOfWork)
		}
		return aow
	}

	hasLineManager() {
		return this.lineManager !== undefined
	}

	getOtherOrganisationIds() {
		return (this.otherOrganisationalUnits || []).map(o => o.id)
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
