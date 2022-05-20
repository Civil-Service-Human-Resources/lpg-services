import {Record, RecordState} from '../../models/record'

export class ModuleRecord extends Record {
	id: number
	completionDate?: Date
	eventId?: string
	eventDate?: Date
	moduleId: string
	moduleTitle: string
	moduleType: string
	optional: boolean
	cost?: number
	duration?: number
	rated?: boolean
	bookingStatus?: RecordState
	createdAt?: Date
	updatedAt?: Date

	constructor(data: any) {
		super(data.state, data.userId)
		this.id = data.id
		this.moduleId = data.moduleId
		this.moduleType = data.type
		this.moduleTitle = data.title
		this.optional = data.optional
		this.cost = data.cost
		this.duration = data.duration
		this.updatedAt = data.updatedAt
	}
}
