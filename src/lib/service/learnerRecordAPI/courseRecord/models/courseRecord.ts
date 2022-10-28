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
		const existingModuleIndex = this.modules.findIndex(m => m.id === moduleRecordId)

		if (existingModuleIndex > -1) {
			this.modules[existingModuleIndex] = moduleRecord
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
		console.log("Required for completion:")
		console.log(modulesRequiredForCompletion)
		console.log("Completed IDs:")
		console.log(completedModuleIds)
		return completedModuleIds.every(i => modulesRequiredForCompletion.includes(i))
	}

	private fillRecords = (moduleRecords: ModuleRecord[]) => {
		this.modules = moduleRecords.map(m => plainToClass(ModuleRecord, m as ModuleRecord))
	}
}
