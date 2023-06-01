import { assert } from 'chai'
import { Course, RequiredRecurringAudience } from 'lib/model'
import { CourseRecord } from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import { RecordState } from 'lib/service/learnerRecordAPI/models/record'
import * as sinon from 'sinon'

import * as controller from './index'

const getBasicCourseRecord = (state: RecordState) => {
	return new CourseRecord('Test001', '', state, [], '', false)
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
	course.modules = []
	sandbox.stub(course, 'getRequiredRecurringAudience').returns(audience)
	describe("When the course has not been completed", () => {
		const courseRecord = getBasicCourseRecord(RecordState.InProgress)
		it('should set the state to not started (null) when a course is ' +
			'updated during the previous learning year', () => {
			courseRecord.lastUpdated = lastYearDate
			const result = controller.getDisplayStateForCourse(course, courseRecord)
			assert.equal(result, RecordState.Null)
		})
		it('should set the state to in-progress when a course is' +
			'in progress during the current learning year', () => {
			courseRecord.lastUpdated = thisYearDate
			const result = controller.getDisplayStateForCourse(course, courseRecord)
			assert.equal(result, RecordState.InProgress)
		})
	})

	describe("When the course has already been completed", () => {
		let getCompletionDatesForModulesStub: sinon.SinonStub
		afterEach(() => {
			getCompletionDatesForModulesStub.restore()
		})
		const courseRecord = getBasicCourseRecord(RecordState.Completed)
		it('should set the state to not started (null) when all modules have' +
		'been completed during the previous learning year', () => {
			getCompletionDatesForModulesStub = sandbox.stub(
				courseRecord, 'getCompletionDatesForModules').returns([
				lastYearDate, lastYearDate,
			])
			const result = controller.getDisplayStateForCourse(course, courseRecord)
			assert.equal(result, RecordState.Null)
		})
		it('should set the state to in-progress when a module has ' +
			'been completed during the previous learning year and another' +
			'has been completed in the current learning year', () => {
			getCompletionDatesForModulesStub = sandbox.stub(
				courseRecord, 'getCompletionDatesForModules').returns([
				lastYearDate, thisYearDate,
			])
			const result = controller.getDisplayStateForCourse(course, courseRecord)
			assert.equal(result, RecordState.InProgress)
		})
		it('should set the state to completed when both modules have' +
			'been completed during the current learning year', () => {
			getCompletionDatesForModulesStub = sandbox.stub(
				courseRecord, 'getCompletionDatesForModules').returns([
				thisYearDate, thisYearDate,
			])
			const result = controller.getDisplayStateForCourse(course, courseRecord)
			assert.equal(result, RecordState.Completed)
		})
	})

})
