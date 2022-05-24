import {Module, User} from '../../model'
import {RecordState} from '../learnerRecordAPI/models/record'
import {ModuleRecord} from '../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {ModuleRecordInput} from '../learnerRecordAPI/moduleRecord/models/moduleRecordInput'

export class FullModuleRecord {
	id?: number
	moduleId: string
	courseId: string
	title: string
	optional: boolean
	type: string
	duration: number
	state?: RecordState
	user: User

	constructor(moduleData: Module, user: User, courseId: string, moduleRecord?: ModuleRecord) {
		this.moduleId = moduleData.id
		this.courseId = courseId
		this.title = moduleData.title
		this.optional = moduleData.optional
		this.type = moduleData.type
		this.duration = moduleData.duration
		this.user = user

		if (moduleRecord) {
			this.id = moduleRecord.id
			this.state = moduleRecord.state
		} else {
			this.id = undefined
			this.state = RecordState.NotStarted
		}
	}

	getAsModuleRecordInput() {
		return new ModuleRecordInput(
			this.user.id,
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
