import {expect} from 'chai'
import * as sinon from 'sinon'

import {RecordState} from '../../models/record'
import {SkipBookingActionWorker} from '../moduleRecordActionWorkers/eventWorkers/SkipBookingActionWorker'
import {testUpdateCourseRecord, testUpdateModuleRecord} from './moduleRecordWorkerTestUtils'
import {
	genericEvent,
	genericModuleRecord,
	getCourseRecordWithOneModuleRecord,
	getCourseRecordWithTwoModuleRecords,
	getCourseWithOneRequiredModule,
	getCourseWithTwoRequiredModules,
	mockCreateCourseRecord,
	mockCreateModuleRecord,
	mockGetCourseRecord,
	mockTime,
	testUser,
} from './workerTestUtils'

describe('Should test the module event action worker classes', () => {
	beforeEach(() => {
		mockTime()
	})

	afterEach(() => {
		sinon.restore()
	})

	describe('Should test skipping a booking', () => {
		it(`Should throw an error when a booking is skipped,
        if the course record doesn't exist`, async () => {
			const course = getCourseWithOneRequiredModule("course 100", "module 100")
			const event = genericEvent("event 100")
			const worker = new SkipBookingActionWorker(course, testUser, event, course.modules[0])
			mockGetCourseRecord()
			const createCourseRecordMock = mockCreateCourseRecord()
			worker.applyActionToLearnerRecord()
			expect(createCourseRecordMock.getCalls.length).to.eql(0)
		})

		it(`Should throw an error when a booking is skipped,
        if the module record doesn't exist`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed
			)
			courseRecord.modules.pop()
			const event = genericEvent("event 100")
			mockGetCourseRecord()
			mockCreateCourseRecord()
			const createModuleRecordMock = mockCreateModuleRecord(genericModuleRecord(1))
			const worker = new SkipBookingActionWorker(course, testUser, event, course.modules[1])
			worker.applyActionToLearnerRecord()
			expect(createModuleRecordMock.getCalls.length).to.eql(0)
		})

		it(`Should unregsiter the course record if it is currently registered`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithTwoModuleRecords(
				1,
				2,
				course.id,
				RecordState.Registered,
				course.modules[0].id,
				RecordState.InProgress,
				course.modules[1].id,
				RecordState.Completed
			)
			const event = genericEvent("event 100")
			const worker = new SkipBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateCourseRecord(worker, courseRecord, courseRecord.modules[1], [
				{op: 'replace', path: '/state', value: 'SKIPPED'},
			])
		})

		it(`Should correctly update the module record`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithTwoModuleRecords(
				1,
				2,
				course.id,
				RecordState.Null,
				course.modules[0].id,
				RecordState.InProgress,
				course.modules[1].id,
				RecordState.InProgress
			)
			const event = genericEvent("event 100")
			const worker = new SkipBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/state', value: 'SKIPPED'},
				{op: 'remove', path: '/bookingStatus', value: undefined},
				{op: 'remove', path: '/result', value: undefined},
				{op: 'remove', path: '/score', value: undefined},
				{op: 'remove', path: '/completionDate', value: undefined},
			])
		})
	})
})
