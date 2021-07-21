import * as datetime from 'lib/datetime'
import { ModuleRecord } from './moduleRecord'
import { Record } from './record'

export class CourseRecord extends Record {
	courseId: string
	courseTitle: string
	modules: ModuleRecord[]
	preference?: string
	lastUpdated?: Date

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
		let matchingModules = this.modules.filter(m => m.moduleId === moduleId)
		if (matchingModules.length === 0) {
			return null
		} else {
			return matchingModules[0]
		}
	}

	getSelectedDate() {
		for (const moduleRecord of this.modules) {
			if (moduleRecord.eventDate) {
				return moduleRecord.eventDate
			}
		}
		return undefined
	}

	getType() {
		if (!this.modules.length) {
			return null
		}
		if (this.modules.length > 1) {
			return 'blended'
		}
		return this.modules[0].moduleType
	}

	getDuration() {
		const durationArray = this.modules.map(m => m.duration || 0)
		return durationArray.length
			? datetime.formatCourseDuration(durationArray.reduce((p, c) => p + c, 0))
			: null
	}

	getCompletionDate() {
		if (this.isCompleted()) {
			let completionDate: Date | undefined
			for (const moduleRecord of this.modules) {
				if (!completionDate) {
					completionDate = moduleRecord.completionDate
				} else if (
					moduleRecord.completionDate &&
					moduleRecord.completionDate > completionDate
				) {
					completionDate = moduleRecord.completionDate
				}
			}
			return completionDate
		}
		return undefined
	}

	getStartedDate() {
		let startedDate: Date | undefined
		for (const moduleRecord of this.modules) {
			if (!startedDate) {
				startedDate = moduleRecord.createdAt
			} else if (
				moduleRecord.createdAt &&
				moduleRecord.createdAt < startedDate
			) {
				startedDate = moduleRecord.createdAt
			}
		}
		return startedDate
	}

	isActive() {
		return (
			!this.isArchived() &&
			!this.isSkipped() &&
			this.preference !== 'DISLIKED'
		)
	}
}