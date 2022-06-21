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

	// STATE NOTE: For some reason, course records that are in progress can sometimes be
	// stored with state=NULL. So if a course record exists but the state is null, default
	// it to IN_PROGRESS here so that lpg-ui has an easier time working with it.
	constructor(courseId: string, userId: string, state: RecordState = RecordState.InProgress,
		modules: ModuleRecord[] = [], courseTitle: string, required: boolean, preference?: string,
		lastUpdated?: Date) {

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

	private fillRecords = (moduleRecords: ModuleRecord[]) => {
		this.modules = moduleRecords.map(m => Object.assign(ModuleRecord, m))
	}

	public getModuleRecord = (moduleId: string) => {
		const records = this.modules.filter(m => m.moduleId === moduleId)
		if (records.length > 0) {
			return records[0]
		} else {
			return undefined
		}
	}

}
