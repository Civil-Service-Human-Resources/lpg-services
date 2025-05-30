import {Type} from 'class-transformer'

import {Record, RecordState} from './record'

export type ModuleRecordResult = 'FAILED' | 'PASSED'

export type BookingStatus = '' | 'REQUESTED' | 'CONFIRMED' | 'CANCELLED'

export class ModuleRecord extends Record {
	id: number
	@Type(() => Date)
	completionDate?: Date
	eventId?: string
	@Type(() => Date)
	eventDate?: Date
	moduleId: string
	moduleTitle: string
	moduleType: string
	optional: boolean
	cost: number
	duration?: number
	rated?: boolean
	bookingStatus: BookingStatus
	@Type(() => Date)
	createdAt?: Date
	@Type(() => Date)
	updatedAt?: Date
	result?: ModuleRecordResult

	// STATE NOTE: For some reason, module records that are in progress can sometimes be
	// stored with state=NULL. So if a module record exists but the state is null, default
	// it to IN_PROGRESS here so that lpg-ui has an easier time working with it.
	constructor(
		id: number,
		moduleId: string,
		userId: string,
		courseId: string,
		createdAt: Date,
		updatedAt: Date,
		moduleTitle: string,
		moduleType: string,
		state: RecordState = 'IN_PROGRESS',
		cost: number = 0,
		optional: boolean,
		result?: ModuleRecordResult,
		eventId?: string,
		completionDate?: Date,
		bookingStatus?: BookingStatus,
		duration?: number,
		eventDate?: Date
	) {
		super(courseId, userId, state)
		this.id = id
		this.moduleTitle = moduleTitle
		this.moduleId = moduleId
		this.createdAt = new Date(createdAt)
		this.updatedAt = new Date(updatedAt)
		this.eventId = eventId
		this.result = result
		this.completionDate = completionDate ? new Date(completionDate) : undefined
		this.bookingStatus = bookingStatus || ''
		this.moduleType = moduleType
		this.duration = duration
		this.eventDate = eventDate ? new Date(eventDate) : undefined
		this.cost = cost
		this.optional = optional
	}

	getCompletionDate() {
		return this.completionDate ? new Date(this.completionDate) : new Date(0)
	}

	getUpdatedAt() {
		return this.updatedAt ? new Date(this.updatedAt) : new Date(0)
	}
}
