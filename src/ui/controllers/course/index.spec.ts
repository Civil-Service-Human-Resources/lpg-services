import {assert} from 'chai'
import {RequiredRecurringAudience} from 'lib/model'
import {RecordState} from 'lib/service/learnerRecordAPI/models/record'
import {ModuleRecord} from 'lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'

export const getBasicModuleRecord = (moduleId: string, state: RecordState, lastUpdated: Date, completedDate?: Date) => {
	const moduleRecord = new ModuleRecord(0, moduleId, '', '', new Date(),
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

	it('should set the state to not started (null) when a module is' +
		'completed during the previous learning year', () => {
		const moduleRecord = getBasicModuleRecord("1", RecordState.Completed, lastYearDate, lastYearDate)
		const result = moduleRecord.getDisplayState(audience)
		assert.equal(result, null)
	})
	it('should set the state to not started (null) when a module is' +
		'in progress during the previous learning year', () => {
		const moduleRecord = getBasicModuleRecord("1", RecordState.InProgress, lastYearDate)
		const result = moduleRecord.getDisplayState(audience)
		assert.equal(result, null)
	})
	it('should set the state to IN_PROGRESS when a module is' +
		'in progress during the current learning year', () => {
		const moduleRecord = getBasicModuleRecord("1", RecordState.InProgress, thisYearDate)
		const result = moduleRecord.getDisplayState(audience)
		assert.equal(result, "IN_PROGRESS")
	})
	it('should set the state to COMPLETED when a module is' +
		'completed during the current learning year', () => {
		const moduleRecord = getBasicModuleRecord("1", RecordState.Completed, thisYearDate, thisYearDate)
		const result = moduleRecord.getDisplayState(audience)
		assert.equal(result, "COMPLETED")
	})
	it('should set the state to COMPLETED when a module has been completed on a non-recurring course ', () => {
		const moduleRecord = getBasicModuleRecord("1", RecordState.Completed, lastYearDate, lastYearDate)
		const result = moduleRecord.getDisplayState(null)
		assert.equal(result, "COMPLETED")
	})

})
