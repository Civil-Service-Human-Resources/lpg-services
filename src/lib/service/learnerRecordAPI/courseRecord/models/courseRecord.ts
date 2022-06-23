import {Record, RecordState} from '../../models/record'
import {ModuleRecord} from '../../moduleRecord/models/moduleRecord'

export class CourseRecordResponse {
	courseRecords: CourseRecord[]

	constructor(courseRecords: CourseRecord[]) {
		this.courseRecords = courseRecords
	}
}

export class CourseRecord extends Record {
	courseTitle: string
	modules: ModuleRecord[]
	preference?: string
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
		preference?: string,
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

	public getModuleRecord = (moduleId: string) => {
		const records = this.modules.filter(m => m.moduleId === moduleId)
		if (records.length > 0) {
			return records[0]
		} else {
			return undefined
		}
	}

	private fillRecords = (moduleRecords: ModuleRecord[]) => {
		this.modules = moduleRecords.map(m => Object.assign(ModuleRecord, m))
	}

}
