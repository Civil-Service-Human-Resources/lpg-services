import {assert, expect} from 'chai'
import {Course, Module, RequiredRecurringAudience} from 'lib/model'
import * as model from 'lib/model'
import {AreaOfWork, Grade} from 'lib/registry'
import {CourseRecord} from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from 'lib/service/learnerRecordAPI/models/record'
import {ModuleRecord} from 'lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'
import * as sinon from 'sinon'

const genericAOW = new AreaOfWork(1, 'co')
const genericGrade = new Grade('Test', 'Test')

describe('Should test User roles logic', () => {
	it('User should have role if it was created with it', () => {
		const user = new model.User(
			'id123',
			'test@example.com',
			['learner'],
			''
		)
		user.department = 'commercial'
		user.areasOfWork = genericAOW
		user.givenName = 'Test'
		user.grade = genericGrade

		expect(user.hasRole('learner')).to.equal(true)
	})

	it('User have role if was created with it and other roles', () => {
		const user = new model.User(
			'id123',
			'test@example.com',
			['learner', 'management', 'other'],
			''
		)
		user.department = 'commercial'
		user.areasOfWork = genericAOW
		user.givenName = 'Test'
		user.grade = genericGrade

		expect(user.hasRole('learner')).to.equal(true)
	})

	it('User should not have role if it was created without it', () => {
		const user = new model.User(
			'id123',
			'test@example.com',
			['management'],
			''
		)
		user.department = 'commercial'
		user.areasOfWork = genericAOW
		user.givenName = 'Test'
		user.grade = genericGrade

		expect(user.hasRole('learner')).to.equal(false)
	})

	it('User should not have learner or management role if was created with no roles', () => {
		const user = new model.User(
			'id123',
			'test@example.com',
			[],
			''
		)
		user.department = 'commercial'
		user.areasOfWork = genericAOW
		user.givenName = 'Test'
		user.grade = genericGrade

		expect(user.hasRole('learner')).to.equal(false)
		expect(user.hasRole('management')).to.equal(false)
	})

	it('User should not have learner or management role if was created with role in upper case', () => {
		const user = new model.User(
			'id123',
			'test@example.com',
			['Learner'],
			''
		)
		user.department = 'commercial'
		user.areasOfWork = genericAOW
		user.givenName = 'Test'
		user.grade = genericGrade

		expect(user.hasRole('learner')).to.equal(false)
	})
})

export const getBasicCourseRecord = (id?: string) => {
	return new CourseRecord(id || 'test1', '', RecordState.Null, [], '', false)
}

export const getBasicModuleRecord = (moduleId: string, state: RecordState, lastUpdated: Date, completedDate?: Date) => {
	const moduleRecord = new ModuleRecord(0, moduleId, '', '', new Date(),
		lastUpdated, '', 'link', state, 0, false, undefined)
	moduleRecord.completionDate = completedDate
	return moduleRecord
}

describe('displayState tests', () => {
	/**
	 * Audience with a due by date of 31/03/2020 on a yearly frequency
	 */
	const audience = new RequiredRecurringAudience(new Date("2020-03-31"), new Date("2021-03-31"))

	const lastYearDate = new Date("2020-03-30")
	const thisYearDate = new Date("2020-04-05")
	const module1 = Module.create({id: "1", type: "elearning", optional: true})
	const module2 = Module.create({id: "2", type: "elearning", optional: false})
	const module3 = Module.create({id: "3", type: "elearning", optional: false})
	const module4 = Module.create({id: "4", type: "elearning", optional: true})
	describe('getDisplayStateForCourse tests', () => {
		const sandbox = sinon.createSandbox()

		describe("Course has both required and optional modules", () => {
			const course = new Course("testId")
			course.modules = [module1, module2, module3]
			sandbox.stub(course, 'getRequiredRecurringAudience').returns(audience)
			const courseRecord = getBasicCourseRecord()
			courseRecord.modules = [
				getBasicModuleRecord("1", RecordState.Completed, lastYearDate, lastYearDate),
				getBasicModuleRecord("2", RecordState.Completed, lastYearDate, lastYearDate),
				getBasicModuleRecord("3", RecordState.Completed, lastYearDate, lastYearDate),
			]
			it('should set the state to not started (null) when all modules have' +
				'been completed during the previous learning year', () => {
				courseRecord.getModuleRecord("1")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("2")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("3")!.completionDate = lastYearDate
				const result = course.getDisplayState(courseRecord)
				assert.equal(result, RecordState.Null)
			})
			it('should set the state to in-progress when required modules have ' +
				'been completed during the previous learning year and an optional module ' +
				'is in-progress this year', () => {
				courseRecord.getModuleRecord("1")!.updatedAt = thisYearDate
				courseRecord.getModuleRecord("2")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("3")!.completionDate = lastYearDate
				const result = course.getDisplayState(courseRecord)
				assert.equal(result, RecordState.InProgress)
			})
			it('should set the state to in-progress when required modules have ' +
				'been completed during the previous learning year and an optional module ' +
				'is completed this year', () => {
				courseRecord.getModuleRecord("1")!.completionDate = thisYearDate
				courseRecord.getModuleRecord("2")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("3")!.completionDate = lastYearDate
				const result = course.getDisplayState(courseRecord)
				assert.equal(result, RecordState.InProgress)
			})
			it('should set the state to in-progress when a module has ' +
				'been completed during the previous learning year and another ' +
				'required module has been completed in the current learning year', () => {
				courseRecord.getModuleRecord("1")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("2")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("3")!.completionDate = thisYearDate
				const result = course.getDisplayState(courseRecord)
				assert.equal(result, RecordState.InProgress)
			})
			it('should set the state to completed one required module has' +
				'been progressed during the current learning year', () => {
				courseRecord.getModuleRecord("1")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("2")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("2")!.updatedAt = thisYearDate
				courseRecord.getModuleRecord("3")!.completionDate = lastYearDate
				const result = course.getDisplayState(courseRecord)
				assert.equal(result, RecordState.InProgress)
			})
			it('should set the state to completed when both required modules have' +
				'been completed during the current learning year', () => {
				courseRecord.getModuleRecord("1")!.completionDate = lastYearDate
				courseRecord.getModuleRecord("2")!.completionDate = thisYearDate
				courseRecord.getModuleRecord("3")!.completionDate = thisYearDate
				const result = course.getDisplayState(courseRecord)
				assert.equal(result, RecordState.Completed)
			})
			it('should set the state to null when there are no module records', () => {
				const emptyCourseRecord = getBasicCourseRecord()
				const result = course.getDisplayState(emptyCourseRecord)
				assert.equal(result, RecordState.Null)
			})
		})

		describe("Course has only optional modules", () => {
			const course = new Course("testId")
			course.modules = [module1, module4]
			sandbox.stub(course, 'getRequiredRecurringAudience').returns(audience)
			const courseRecord = getBasicCourseRecord()
			courseRecord.modules = [
				getBasicModuleRecord("1", RecordState.Completed, lastYearDate, lastYearDate),
				getBasicModuleRecord("4", RecordState.Completed, lastYearDate, lastYearDate),
			]
			it('should set the state to completed when all module records have been completed ' +
				'this learning period', () => {
				courseRecord.getModuleRecord("1")!.completionDate = thisYearDate
				courseRecord.getModuleRecord("4")!.completionDate = thisYearDate
				const result = course.getDisplayState(courseRecord)
				assert.equal(result, RecordState.Completed)
			})
		})

	})

	describe('getDisplayStateForModule tests', () => {

		it('should set the state to not started (null) when a module is' +
			'completed during the previous learning year', () => {
			const moduleRecord = getBasicModuleRecord("1", RecordState.Completed, lastYearDate, lastYearDate)
			const result = module1.getDisplayState(moduleRecord, audience)
			assert.equal(result, null)
		})
		it('should set the state to not started (null) when a module is' +
			'in progress during the previous learning year', () => {
			const moduleRecord = getBasicModuleRecord("1", RecordState.InProgress, lastYearDate)
			const result = module1.getDisplayState(moduleRecord, audience)
			assert.equal(result, null)
		})
		it('should set the state to IN_PROGRESS when a module is' +
			'in progress during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord("1", RecordState.InProgress, thisYearDate)
			const result = module1.getDisplayState(moduleRecord, audience)
			assert.equal(result, "IN_PROGRESS")
		})
		it('should set the state to COMPLETED when a module is' +
			'completed during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord("1", RecordState.Completed, thisYearDate, thisYearDate)
			const result = module1.getDisplayState(moduleRecord, audience)
			assert.equal(result, "COMPLETED")
		})
		it('should set the state to COMPLETED when a module has been completed on a non-recurring course ', () => {
			const moduleRecord = getBasicModuleRecord("1", RecordState.Completed, lastYearDate, lastYearDate)
			const result = module1.getDisplayState(moduleRecord, null)
			assert.equal(result, "COMPLETED")
		})
		it('should set the state to NULL when a module has no record associated ', () => {
			const result = module1.getDisplayState(null, null)
			assert.equal(result, null)
		})
	})
})
