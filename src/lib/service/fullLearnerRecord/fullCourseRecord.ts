import {Course} from '../../model'
import {CourseRecord} from '../learnerRecordAPI/courseRecord/models/courseRecord'
import {CourseRecordInput} from '../learnerRecordAPI/courseRecord/models/courseRecordInput'
import {Record, RecordState} from '../learnerRecordAPI/models/record'
import { ModuleRecord } from '../learnerRecordAPI/moduleRecord/models/moduleRecord'
import { ModuleRecordInput } from '../learnerRecordAPI/moduleRecord/models/moduleRecordInput'
import {FullModuleRecord} from './fullModuleRecord'

export class FullCourseRecord extends Record {
	required: boolean
	courseTitle: string
	modules: Map<string, FullModuleRecord> = new Map()

	constructor(courseData: Course, userId: string, courseRecord?: CourseRecord) {
		super(courseData.id, userId, courseRecord ? courseRecord.state : RecordState.NotStarted)
		this.courseId = courseData.id
		this.required = courseData.isRequired()
		this.courseTitle = courseData.title
		this.addModules(courseData, courseRecord)
	}

	getAsCourseRecordInput(includeModules: boolean = false) {
		let moduleInputs: ModuleRecordInput[] = []
		if (includeModules) {
			moduleInputs = Object.values(this.modules).map(m => m.getAsModuleRecordInput())
		}
		return new CourseRecordInput(this.courseId, this.courseTitle, this.userId, this.required, moduleInputs, this.state)
	}

	updateModule(moduleId: string, module: FullModuleRecord) {
		this.modules.set(moduleId, module)
	}

	fetchModule(moduleId: string) {
		const mod = this.modules.get(moduleId)
		if (!mod) {
			throw new Error(`Module ${moduleId} was not found within course ${this.courseId} but was expected.`)
		}
		return mod
	}

	areAllRequiredModulesComplete() {
		const remainingRequiredModules = [...this.modules.values()].filter(m => !m.isCompleted() && !m.optional)
		console.log(remainingRequiredModules)
		return remainingRequiredModules.length === 0
	}

	private addModules(courseData: Course, courseRecord?: CourseRecord) {
		courseData.modules.forEach(mod => {
			let moduleRecord: ModuleRecord | undefined
			if (courseRecord) {
				moduleRecord = courseRecord.getModuleRecord(mod.id)
			}
			const fullModuleRecord = new FullModuleRecord(mod, this.userId, this.courseId, moduleRecord)
			this.modules.set(mod.id, fullModuleRecord)
		})
	}

}
