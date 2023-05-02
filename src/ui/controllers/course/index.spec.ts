import {assert} from 'chai'
import {RequiredRecurringAudience} from 'lib/model'
import {CourseRecord} from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from 'lib/service/learnerRecordAPI/models/record'
import {ModuleRecord} from 'lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'
import * as controller from './index'

const getBasicCourseRecord = (state: RecordState) => {
	return new CourseRecord('Test001', '', state, [], '', false)
}
const getBasicModuleRecord = (state: RecordState, lastUpdated: Date, completedDate?: Date) => {
	const moduleRecord = new ModuleRecord(0, "Test002", '', '', new Date(),
		lastUpdated, '', 'link', state, 0, false, undefined)
	moduleRecord.completionDate = completedDate
	return moduleRecord
}

const lastYearDate = new Date("2020-03-30")
const thisYearDate = new Date("2020-04-05")
describe('getDisplayStateForModule tests', () => {
	/**
	 * Audience with a due by date of 31/03/2020 on a yearly frequency
	 */
	const audience = new RequiredRecurringAudience(new Date("2020-03-31"), new Date("2021-03-31"))
	describe("When the course has not been completed", () => {
		const courseRecord = getBasicCourseRecord(RecordState.InProgress)
		it('should set the state to not started (null) when a module is' +
			'completed during the previous learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.Completed, lastYearDate, lastYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, null)
		})
		it('should set the state to not started (null) when a module is' +
			'in progress during the previous learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.InProgress, lastYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, null)
		})
		it('should set the state to IN_PROGRESS when a module is' +
						'in progress during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.InProgress, thisYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, "IN_PROGRESS")
		})
		it('should set the state to COMPLETED when a module is' +
			'completed during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.Completed, thisYearDate, thisYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, "COMPLETED")
		})
	})

	describe("When the course has already been completed", () => {
		const courseRecord = getBasicCourseRecord(RecordState.Completed)
		it('should set the state to not started (null) when a module is' +
			'completed during the previous learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.Completed, lastYearDate, lastYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, null)
		})
		it('should set the state to not started (null) when a module is' +
			'in progress during the previous learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.InProgress, lastYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, null)
		})
		it('should set the state to IN_PROGRESS when a module is' +
			'in progress during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.InProgress, thisYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, "IN_PROGRESS")
		})
		it('should set the state to COMPLETED when a module is' +
			'completed during the current learning year', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.Completed, thisYearDate, thisYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, audience)
			assert.equal(result, "COMPLETED")
		})
		it('should set the state to COMPLETED when a module has been completed on a non-recurring course ', () => {
			const moduleRecord = getBasicModuleRecord(RecordState.Completed, lastYearDate, lastYearDate)
			const result = controller.getDisplayStateForModule(moduleRecord, courseRecord, null)
			assert.equal(result, "COMPLETED")
		})
	})

})
