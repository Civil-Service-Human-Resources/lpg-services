import {Course, User} from '../../model'
import {completeCourseRecord, createCourseRecord} from '../learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../learnerRecordAPI/courseRecord/models/courseRecord'
import {CourseRecordInput} from '../learnerRecordAPI/courseRecord/models/courseRecordInput'
import {RecordState} from '../learnerRecordAPI/models/record'
import {completeModuleRecord, createModuleRecord, initialiseModuleRecord} from '../learnerRecordAPI/moduleRecord/client'
import {FullModuleRecord} from './fullModuleRecord'

export class FullCourseRecord {
	courseId: string
	required: boolean
	courseTitle: string
	user: User
	modules: Map<string, FullModuleRecord>
	state?: RecordState

	constructor(courseData: Course, user: User, courseRecord?: CourseRecord) {
		this.courseId = courseData.id
		this.required = courseData.isRequired()
		this.courseTitle = courseData.title
		this.user = user
		this.state = courseRecord ? courseRecord.state : RecordState.NotStarted
		this.addModules(courseData, courseRecord)
	}

	getAsCourseRecordInput() {
		return new CourseRecordInput(this.courseId, this.courseTitle, this.user.userId, this.required, [], this.state)
	}

	async progressModule(moduleId: string) {
		const module = this.fetchModule(moduleId)
		if (this.state === RecordState.NotStarted) {
			module.state = RecordState.InProgress
			this.state = RecordState.InProgress
			await this.createNewCourseRecord(module)
		} else {
			if (module.state === RecordState.NotStarted) {
				module.state = RecordState.InProgress
				await this.createNewModuleRecord(module)
			} else {
				await initialiseModuleRecord(module.id!, this.user)
			}
		}
		this.modules.set(module.moduleId, module)
	}

	async completeModule(moduleId: string) {
		const module = this.fetchModule(moduleId)
		if (this.state === RecordState.NotStarted) {
			module.state = RecordState.Completed
			this.state = this.modules.size === 1 ? RecordState.Completed : RecordState.InProgress
			await this.createNewCourseRecord(module)
		} else {
			if (module.state === RecordState.NotStarted) {
				module.state = RecordState.Completed
				await this.createNewModuleRecord(module)
			} else {
				await completeModuleRecord(module.id!, this.user)
			}
		}
		this.modules.set(module.moduleId, module)

		if (this.areAllModulesComplete()) {
			completeCourseRecord(this.courseId, this.user)
		}
	}

	private addModules(courseData: Course, courseRecord?: CourseRecord) {
		courseData.modules.forEach( module => {
			const moduleRecord = courseRecord ? courseRecord.getModuleRecord(module.id) : undefined
			const fullModuleRecord = new FullModuleRecord(module, this.user, this.courseTitle, moduleRecord)
			this.modules.set(module.id, fullModuleRecord)
		})
	}

	private fetchModule(moduleId: string) {
		const module = this.modules.get(moduleId)
		if (!module) {
			throw new Error(`Module ${moduleId} was not found within course ${this.courseId} but was expected.`)
		}
		return module
	}

	private areAllModulesComplete() {
		const remainingModules = [...this.modules.values()].filter(m => m.state === RecordState.NotStarted)
		return remainingModules.length > 0
	}

	private async createNewCourseRecord(module: FullModuleRecord) {
		const recInput = this.getAsCourseRecordInput()
		recInput.moduleRecords.push(module.getAsModuleRecordInput())
		await createCourseRecord(recInput, this.user)
	}

	private async createNewModuleRecord(module: FullModuleRecord) {
		const newRecord = module.getAsModuleRecordInput()
		await createModuleRecord(newRecord, this.user)
	}

}
