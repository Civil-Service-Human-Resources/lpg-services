import { plainToClass, Type } from 'class-transformer'
import * as datetime from 'lib/datetime'

import { CourseRcd } from '../../../../learnerrecord'
import { Module } from '../../../../model'
import { Record, RecordState } from '../../models/record'
import { BookingStatus, ModuleRecord } from '../../moduleRecord/models/moduleRecord'

export enum CourseRecordPreference {
	Liked = 'LIKED',
	Disliked = 'DISLIKED',
}

export class CourseRecordResponse {
	courseRecords: CourseRecord[]

	constructor(courseRecords: CourseRecord[]) {
		this.courseRecords = courseRecords
	}
}

export class CourseRecord extends Record implements CourseRcd {
	courseTitle: string
	@Type(() => ModuleRecord)
	modules: ModuleRecord[]
	preference?: CourseRecordPreference
	@Type(() => Date)
	lastUpdated?: Date
	courseDisplayState?: string
	required: boolean

	constructor(
		courseId: string,
		userId: string,
		state: RecordState = RecordState.Null,
		modules: ModuleRecord[] = [],
		courseTitle: string,
		required: boolean,
		preference?: CourseRecordPreference,
		lastUpdated?: Date
	) {
		super(courseId, userId, state)
		this.courseTitle = courseTitle
		this.preference = preference
		this.required = required
		if (lastUpdated) {
			this.lastUpdated = new Date(lastUpdated)
		}

		this.fillRecords(modules)
	}

	public upsertModuleRecord(moduleRecordId: number, moduleRecord: ModuleRecord) {
		const existingModuleIndex = this.modules.findIndex(m => m.id === moduleRecordId)

		if (existingModuleIndex > -1) {
			this.modules[existingModuleIndex] = moduleRecord
		} else {
			this.modules.push(moduleRecord)
		}
	}

	// For compatibility with legacy code; remove once the old
	// CourseRecord class is redundant
	public isComplete() {
		return this.isCompleted()
	}

	public isDisliked() {
		return this.preference === CourseRecordPreference.Disliked
	}

	public isActive() {
		return (
			!this.isArchived() &&
			!this.isSkipped() &&
			!this.isDisliked()
		)
	}

	public setBookingStatus(bookingStatus?: BookingStatus) {
		switch (bookingStatus) {
			case BookingStatus.CANCELLED:
				this.state = RecordState.Cancelled
				break
			case BookingStatus.REQUESTED:
				this.state = RecordState.Requested
				break
			case BookingStatus.CONFIRMED:
				this.state = RecordState.Confirmed
				break
			default:
				break
		}
	}

	public getSelectedDate() {
		for (const moduleRecord of this.modules) {
			if (moduleRecord.eventDate) {
				return moduleRecord.eventDate
			}
		}
		return undefined
	}

	public hasBeenAddedToLearningPlan() {
		return this.isNull()
	}

	public hasBeenRemovedFromLearningPlan() {
		return this.isArchived()
	}

	public getModuleRecord = (moduleId: string) => {
		return this.modules.find(m => m.moduleId === moduleId)
	}

	public areAllRelevantModulesComplete(modules: Module[]) {
		let modulesRequiredForCompletion: string[]
		const completedModuleIds = this.modules.filter(m => m.isCompleted()).map(m => m.moduleId)
		if (modules.every(m => m.optional)) {
			modulesRequiredForCompletion = modules.filter(m => m.optional).map(m => m.id)
		} else {
			modulesRequiredForCompletion = modules.filter(m => !m.optional).map(m => m.id)
		}
		return modulesRequiredForCompletion.every(i => completedModuleIds.includes(i))
	}

	public getLastUpdated() {
		return this.lastUpdated ? this.lastUpdated : new Date(0)
	}

	public getCompletionDatesForModules(filterModules?: Module[]) {
		if (filterModules) {
			const mrMap: Map<string, ModuleRecord> = new Map()
			this.modules.forEach(mr => mrMap.set(mr.moduleId, mr))
			return filterModules.map(mod => {
				const moduleRecord = mrMap.get(mod.id)
				if (moduleRecord) {
					return moduleRecord.getCompletionDate()
				} else {
					return new Date(0)
				}
			})
		} else {
			return this.modules.map(mr => mr.getCompletionDate())
		}
	}

	public getCompletionDate() {
		let completionDate
		if (this.isCompleted()) {
			for (const moduleRecord of this.modules) {
				const moduleRecordCompletionDate = moduleRecord.getCompletionDate()
				if (!completionDate) {
					completionDate = moduleRecordCompletionDate
				} else if (
					moduleRecordCompletionDate > completionDate
				) {
					completionDate = moduleRecordCompletionDate
				}
			}
		}
		return completionDate
	}

	getDuration() {
		const durationArray = this.modules.map(m => m.duration || 0)
		return durationArray.length
			? datetime.formatCourseDuration(durationArray.reduce((p, c) => p + c, 0))
			: null
	}

	public getType() {
		if (!this.modules.length) {
			return null
		}
		if (this.modules.length > 1) {
			return 'blended'
		}
		return this.modules[0].moduleType
	}

	private fillRecords = (moduleRecords: ModuleRecord[]) => {
		this.modules = moduleRecords.map(m => plainToClass(ModuleRecord, m as ModuleRecord))
	}
}
