import {Module} from '../../model'
import {Record, RecordState} from '../learnerRecordAPI/models/record'
import {ModuleRecord} from '../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {ModuleRecordInput} from '../learnerRecordAPI/moduleRecord/models/moduleRecordInput'

export class FullModuleRecord extends Record {
	id?: number
	moduleId: string
	title: string
	optional: boolean
	type: string
	duration: number

	constructor(moduleData: Module, userId: string, courseId: string, moduleRecord?: ModuleRecord) {
		super(courseId, userId, moduleRecord ? moduleRecord.state : RecordState.NotStarted)
		this.moduleId = moduleData.id
		this.courseId = courseId
		this.title = moduleData.title
		this.optional = moduleData.optional
		this.type = moduleData.type
		this.duration = moduleData.duration

		if (moduleRecord) {
			this.id = moduleRecord.id
		} else {
			this.id = undefined
		}
	}

	getAsModuleRecordInput() {
		return new ModuleRecordInput(
			this.userId,
			this.courseId,
			this.moduleId,
			this.title,
			this.optional,
			this.type,
			this.duration,
			this.state
		)
	}
}
