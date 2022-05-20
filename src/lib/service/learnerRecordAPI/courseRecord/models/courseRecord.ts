import {ModuleRecord} from '../../moduleRecord/models/moduleRecord'
import {Record} from '../../models/record'

export class CourseRecordResponse {
	CourseRecords: CourseRecord[]
}

export class CourseRecord extends Record {
	courseId: string
	courseTitle: string
	modules: ModuleRecord[]
	preference?: string
	lastUpdated?: Date
	courseDisplayState?: string

	constructor(data: any) {
		super(data.state, data.userId)
		this.courseId = data.courseId
		this.courseTitle = data.courseTitle
		this.modules = data.modules || []
		this.preference = data.preference

		if (data.lastUpdated) {
			this.lastUpdated = new Date(data.lastUpdated)
		}

		for (const module of this.modules) {
			if (module.createdAt) {
				module.createdAt = new Date(module.createdAt)
			}
			if (module.updatedAt) {
				module.updatedAt = new Date(module.updatedAt)
			}
			if (module.completionDate) {
				module.completionDate = new Date(module.completionDate)
			}
			if (module.eventDate) {
				module.eventDate = new Date(module.eventDate)
			}
		}
	}

	getModuleRecord(moduleId: string) {
		const records = this.modules.filter((m) => m.moduleId == moduleId)
		if (records.length > 0) {
			return records[0]
		} else {
			return undefined
		}
	}
}
