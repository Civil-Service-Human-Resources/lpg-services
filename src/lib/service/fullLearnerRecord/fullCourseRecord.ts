import {Course} from '../../model'
import {CourseRecord} from '../learnerRecordAPI/courseRecord/models/courseRecord'
import {CourseRecordInput} from '../learnerRecordAPI/courseRecord/models/courseRecordInput'
import {Record, RecordState} from '../learnerRecordAPI/models/record'
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
		const module = this.modules.get(moduleId)
		if (!module) {
			throw new Error(`Module ${moduleId} was not found within course ${this.courseId} but was expected.`)
		}
		return module
	}

	areAllModulesComplete() {
		const remainingModules = [...this.modules.values()].filter(m => m.state === RecordState.NotStarted)
		return remainingModules.length === 0
	}

	private addModules(courseData: Course, courseRecord?: CourseRecord) {
		courseData.modules.forEach( module => {
			console.log(courseRecord)
			let moduleRecord
			if (courseRecord) {
				console.log(courseRecord.getModuleRecord)
				moduleRecord = courseRecord.getModuleRecord(module.id)
			}
			const fullModuleRecord = new FullModuleRecord(module, this.userId!, this.courseId, moduleRecord)
			this.modules.set(module.id, fullModuleRecord)
		})
	}

}
