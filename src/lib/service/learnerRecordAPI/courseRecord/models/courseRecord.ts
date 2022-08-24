import { plainToClass } from 'class-transformer'

import { Module } from '../../../../model'
import { Record, RecordState } from '../../models/record'
import { ModuleRecord } from '../../moduleRecord/models/moduleRecord'

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

export class CourseRecord extends Record {
	courseTitle: string
	modules: ModuleRecord[]
	preference?: CourseRecordPreference
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
		let existingModIndex
		for (let i = 0; i < this.modules.length; i++) {
			const mr = this.modules[i]
			if (mr.id === moduleRecordId) {
				existingModIndex = i
			}
		}

		if (existingModIndex) {
			this.modules[existingModIndex] = moduleRecord
		} else {
			this.modules.push(moduleRecord)
		}
	}

	public hasBeenAddedToLearningPlan() {
		return this.isNull()
	}

	public hasBeenRemovedFromLearningPlan() {
		return this.isArchived()
	}

	public getModuleRecord = (moduleId: string) => {
		const records = this.modules.filter(m => m.moduleId === moduleId)
		if (records.length > 0) {
			return records[0]
		} else {
			return undefined
		}
	}

	public areAllRelevantModulesComplete(modules: Module[]) {
		let modIds: string[]
		const completedModuleIds = this.modules.filter(m => m.isCompleted()).map(m => m.moduleId)
		if (modules.every(m => m.optional)) {
			modIds = modules.filter(m => m.optional).map(m => m.id)
		} else {
			modIds = modules.filter(m => !m.optional).map(m => m.id)
		}
		return completedModuleIds.filter(m => modIds.includes(m)).length === modIds.length
	}

	private fillRecords = (moduleRecords: ModuleRecord[]) => {
		this.modules = moduleRecords.map(m => plainToClass(ModuleRecord, m as ModuleRecord))
	}
}
