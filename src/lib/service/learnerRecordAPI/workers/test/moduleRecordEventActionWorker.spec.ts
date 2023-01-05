import { expect } from 'chai'
import * as sinon from 'sinon'

import { RecordState } from '../../models/record'
import {
	ApprovedBookingActionWorker
} from '../moduleRecordActionWorkers/eventWorkers/ApprovedBookingActionWorker'
import {
	CancelBookingActionWorker
} from '../moduleRecordActionWorkers/eventWorkers/CancelBookingActionWorker'
import {
	CompleteBookingActionWorker
} from '../moduleRecordActionWorkers/eventWorkers/CompleteBookingActionWorker'
import {
	RegisterBookingActionWorker
} from '../moduleRecordActionWorkers/eventWorkers/RegisterBookingActionWorker'
import {
	SkipBookingActionWorker
} from '../moduleRecordActionWorkers/eventWorkers/SkipBookingActionWorker'
import { testCreateCourseRecord } from './courseRecordWorkerTestUtils'
import {
	testCreateModuleRecord, testUpdateCourseRecord, testUpdateModuleRecord
} from './moduleRecordWorkerTestUtils'
import {
	genericEvent, genericModuleRecord, getCourseRecordWithOneModuleRecord,
	getCourseRecordWithTwoModuleRecords, getCourseWithOneRequiredModule,
	getCourseWithTwoRequiredModules, getEventModuleRecord, mockCreateCourseRecord,
	mockCreateModuleRecord, mockGetCourseRecord, mockPatchModuleRecord, mockTime, testDateAsStr,
	testUser
} from './workerTestUtils'

describe('Should test the module event action worker classes', () => {
	beforeEach(() => {
		mockTime()
	})

	afterEach(() => {
		sinon.restore()
	})

	describe('Should test approving a booking', () => {
		it('Should create an approved course record when the booking is confirmed', async () => {
			const course = getCourseWithOneRequiredModule("course 100", "module 100")
			const event = genericEvent("event 100")
			const worker = new ApprovedBookingActionWorker(course, testUser, event, course.modules[0])
			await testCreateCourseRecord(worker, RecordState.Approved, undefined, RecordState.Approved, course)
		})

		it(`Should create an approved module record`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed
			)
			const event = genericEvent("event 100")
			const worker = new ApprovedBookingActionWorker(course, testUser, event, course.modules[1])
			await testCreateModuleRecord(worker, courseRecord, RecordState.Approved, course.modules[1])
		})

		it(`Should approve the course record
            when it isn't currently in progress`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithTwoModuleRecords(
				1,
				2,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed,
				course.modules[1].id,
				RecordState.Completed
			)
			courseRecord.state = RecordState.Completed
			const event = genericEvent("event 100")
			const worker = new ApprovedBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateCourseRecord(worker, courseRecord, courseRecord.modules[1], [
				{op: 'replace', path: '/lastUpdated', value: testDateAsStr},
				{op: 'replace', path: '/state', value: 'APPROVED'},
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
			const worker = new ApprovedBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/state', value: 'APPROVED'},
				{op: 'remove', path: '/result', value: undefined},
				{op: 'remove', path: '/score', value: undefined},
				{op: 'remove', path: '/completionDate', value: undefined},
				{op: 'replace', path: '/eventId', value: event.id},
				{op: 'replace', path: '/eventDate', value: testDateAsStr},
				{op: 'replace', path: '/updatedAt', value: testDateAsStr},
			])
		})
	})

	describe('Should test cancelling a booking', () => {
		it('Should create an unregistered course record when the booking is confirmed', async () => {
			const course = getCourseWithOneRequiredModule("course 100", "module 100")
			const event = genericEvent("event 100")
			const worker = new CancelBookingActionWorker(course, testUser, event, course.modules[0])
			await testCreateCourseRecord(worker, RecordState.Unregistered, undefined, RecordState.Unregistered, course)
		})

		it(`Should create an unregistered module record`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed
			)
			const event = genericEvent("event 100")
			const worker = new CancelBookingActionWorker(course, testUser, event, course.modules[1])
			await testCreateModuleRecord(worker, courseRecord, RecordState.Unregistered, course.modules[1])
		})

		it(`Should unregsiter the course record
            when it isn't currently in progress`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithTwoModuleRecords(
				1,
				2,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed,
				course.modules[1].id,
				RecordState.Completed
			)
			courseRecord.state = RecordState.Completed
			const event = genericEvent("event 100")
			const worker = new CancelBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateCourseRecord(worker, courseRecord, courseRecord.modules[1], [
				{op: 'replace', path: '/lastUpdated', value: testDateAsStr},
				{op: 'replace', path: '/state', value: 'UNREGISTERED'},
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
			const worker = new CancelBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/state', value: 'UNREGISTERED'},
				{op: 'remove', path: '/result', value: undefined},
				{op: 'remove', path: '/score', value: undefined},
				{op: 'remove', path: '/completionDate', value: undefined},
				{op: 'replace', path: '/updatedAt', value: testDateAsStr},
				{op: 'replace', path: '/bookingStatus', value: 'CANCELLED'},
			])
		})
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
				{op: 'replace', path: '/lastUpdated', value: testDateAsStr},
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

	describe('Should test registering for an event', () => {
		it('Should create an approved course record when the booking is confirmed', async () => {
			const course = getCourseWithOneRequiredModule("course 100", "module 100")
			const event = genericEvent("event 100")
			const worker = new RegisterBookingActionWorker(course, testUser, event, course.modules[0])
			await testCreateCourseRecord(worker, RecordState.Registered, undefined, RecordState.Registered, course)
		})

		it(`Should create an approved module record`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed
			)
			const event = genericEvent("event 100")
			const worker = new RegisterBookingActionWorker(course, testUser, event, course.modules[1])
			await testCreateModuleRecord(worker, courseRecord, RecordState.Registered, course.modules[1])
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
			const worker = new RegisterBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateCourseRecord(worker, courseRecord, courseRecord.modules[1], [
				{op: 'replace', path: '/lastUpdated', value: testDateAsStr},
				{op: 'replace', path: '/state', value: 'REGISTERED'},
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
			const worker = new RegisterBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/state', value: 'REGISTERED'},
				{op: 'remove', path: '/result', value: undefined},
				{op: 'remove', path: '/score', value: undefined},
				{op: 'remove', path: '/completionDate', value: undefined},
				{op: 'replace', path: '/eventId', value: event.id},
				{op: 'replace', path: '/eventDate', value: testDateAsStr},
				{op: 'replace', path: '/updatedAt', value: testDateAsStr},
			])
		})
	})

	describe('Should test completing an event module', () => {
		it(`Should throw an error when a booking is completed,
        if the course record doesn't exist`, async () => {
			const course = getCourseWithOneRequiredModule("course 100", "module 100")
			const event = genericEvent("event 100")
			const worker = new CompleteBookingActionWorker(course, testUser, event, course.modules[0])
			mockGetCourseRecord()
			const createCourseRecordMock = mockCreateCourseRecord()
			worker.applyActionToLearnerRecord()
			expect(createCourseRecordMock.getCalls.length).to.eql(0)
		})

		it(`Should throw an error when a booking is completed,
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
			const createModuleRecordMock = mockCreateModuleRecord(genericModuleRecord(2))
			const worker = new CompleteBookingActionWorker(course, testUser, event, course.modules[1])
			worker.applyActionToLearnerRecord()
			expect(createModuleRecordMock.getCalls.length).to.eql(0)
		})

		it(`Should complete the course record if it is currently approved`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithTwoModuleRecords(
				1,
				2,
				course.id,
				RecordState.Registered,
				course.modules[0].id,
				RecordState.Completed,
				course.modules[1].id,
				RecordState.Approved
			)
			console.log(course.id)
			const event = genericEvent("event 100")
			const completedModuleRecord = getEventModuleRecord(
				2,
				course.modules[1].id,
				course.id,
				RecordState.Completed,
				event.id
			)
			const worker = new CompleteBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateCourseRecord(worker, courseRecord, completedModuleRecord, [
				{op: 'replace', path: '/lastUpdated', value: testDateAsStr},
				{op: 'replace', path: '/state', value: 'COMPLETED'},
			])
		})

		it(`Should correctly update the module record if it has been approved`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithTwoModuleRecords(
				1,
				2,
				course.id,
				RecordState.Null,
				course.modules[0].id,
				RecordState.InProgress,
				course.modules[1].id,
				RecordState.Approved
			)
			const event = genericEvent("event 100")
			const worker = new CompleteBookingActionWorker(course, testUser, event, course.modules[1])
			await testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/updatedAt', value: testDateAsStr},
				{op: 'replace', path: '/state', value: 'COMPLETED'},
				{op: 'replace', path: '/completionDate', value: testDateAsStr},
			])
		})

		it(`Should NOT update the module record if it has not been approved`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithTwoModuleRecords(
				1,
				2,
				course.id,
				RecordState.Null,
				course.modules[0].id,
				RecordState.InProgress,
				course.modules[1].id,
				RecordState.Registered
			)
			const event = genericEvent("event 100")
			const worker = new CompleteBookingActionWorker(course, testUser, event, course.modules[1])
			mockGetCourseRecord(courseRecord)
			const patchModRecordMock = mockPatchModuleRecord(courseRecord.modules[0])
			await worker.applyActionToLearnerRecord()
			expect(patchModRecordMock.getCalls.length).to.eql(0)
		})
	})
})
