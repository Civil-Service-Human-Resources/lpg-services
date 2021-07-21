import { Module } from "lib/model"
import { Record, RecordState } from "./record"

export class ModuleRecord extends Record {
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
	bookingStatus?: string
	createdAt?: Date
    updatedAt?: Date

	constructor(module: Module, state?: RecordState, userId?: string, updatedAt?: Date) {
        super(state, userId)
		this.moduleId = module.id
		this.moduleType = module.type
		this.moduleTitle = module.title
		this.optional = module.optional
		this.cost = module.cost
		this.duration = module.duration
        this.updatedAt = updatedAt
	}

}