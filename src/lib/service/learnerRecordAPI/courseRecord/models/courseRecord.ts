import {Record, RecordState} from '../../models/record'
import {ModuleRecord} from '../../moduleRecord/models/moduleRecord'
import { Module } from '../../../../model';

export enum CourseRecordPreference {
	Liked = 'LIKED',
	Disliked = 'DISLIKED'
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

		if (modules.length > 0) {
			this.fillRecords(modules)
		}
	}

	public updateModuleRecord(moduleRecordId: number, moduleRecord: ModuleRecord) {
		for (let i = 0; i < this.modules.length; i++) {
			const mr = this.modules[i];
			if (mr.id === moduleRecordId) {
				this.modules[i] = moduleRecord
			}
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
	
	public areAllRequiredModulesComplete(modules: Module[]) {
		const moduleIds = modules.map(m => m.id)
        const remainingModules = this.modules.filter(m => !moduleIds.includes(m.moduleId) && !m.isCompleted() && !m.optional)
        return remainingModules.length === 0
	}

	private fillRecords = (moduleRecords: ModuleRecord[]) => {
		this.modules = moduleRecords.map(m => Object.assign(ModuleRecord, m))
	}

}
