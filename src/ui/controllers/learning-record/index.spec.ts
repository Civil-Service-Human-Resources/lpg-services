import {assert} from 'chai'
import {Course, Module, RequiredRecurringAudience} from 'lib/model'
import {CourseRecord} from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from 'lib/service/learnerRecordAPI/models/record'
import * as sinon from 'sinon'
import {getBasicModuleRecord} from '../course/index.spec'

const getBasicCourseRecord = () => {
	return new CourseRecord('Test001', '', RecordState.Null, [], '', false)
}

const lastYearDate = new Date("2020-03-30")
const thisYearDate = new Date("2020-04-05")
describe('getDisplayStateForCourse tests', () => {
	const sandbox = sinon.createSandbox()
	/**
	 * Audience with a due by date of 31/03/2020 on a yearly frequency
	 */
	const audience = new RequiredRecurringAudience(new Date("2020-03-31"), new Date("2021-03-31"))
	const course = new Course("testId")
	course.modules = [
		Module.create({id: "1", type: "elearning", optional: true}),
		Module.create({id: "2", type: "elearning", optional: false}),
		Module.create({id: "3", type: "elearning", optional: false}),
	]
	sandbox.stub(course, 'getRequiredRecurringAudience').returns(audience)
	const courseRecord = getBasicCourseRecord()
	courseRecord.modules = [
		getBasicModuleRecord("1", RecordState.Completed, lastYearDate, lastYearDate),
		getBasicModuleRecord("2", RecordState.Completed, lastYearDate, lastYearDate),
		getBasicModuleRecord("3", RecordState.Completed, lastYearDate, lastYearDate),
	]

	describe("When the course has already been completed", () => {
		it('should set the state to not started (null) when all modules have' +
		'been completed during the previous learning year', () => {
			courseRecord.getModuleRecord("1")!.completionDate = lastYearDate
			courseRecord.getModuleRecord("2")!.completionDate = lastYearDate
			courseRecord.getModuleRecord("3")!.completionDate = lastYearDate
			const result = course.getDisplayState(courseRecord)
			assert.equal(result, RecordState.Null)
		})
		it('should set the state to not started (null) when all required modules have' +
			'been completed during the previous learning year', () => {
			courseRecord.getModuleRecord("1")!.completionDate = thisYearDate
			courseRecord.getModuleRecord("2")!.completionDate = lastYearDate
			courseRecord.getModuleRecord("3")!.completionDate = lastYearDate
			const result = course.getDisplayState(courseRecord)
			assert.equal(result, RecordState.Null)
		})
		it('should set the state to in-progress when a module has ' +
			'been completed during the previous learning year and another' +
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
	})

})
