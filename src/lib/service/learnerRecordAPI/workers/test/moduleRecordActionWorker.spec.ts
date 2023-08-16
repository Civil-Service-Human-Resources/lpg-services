import * as sinon from 'sinon'

import {RecordState} from '../../models/record'
import {CompletedActionWorker} from '../moduleRecordActionWorkers/CompletedActionWorker'
import {FailModuleActionWorker} from '../moduleRecordActionWorkers/FailModuleActionWorker'
import {InitialiseActionWorker} from '../moduleRecordActionWorkers/initialiseActionWorker'
import {PassModuleActionWorker} from '../moduleRecordActionWorkers/PassModuleActionWorker'
import {testCreateCourseRecord} from './courseRecordWorkerTestUtils'
import {testCreateModuleRecord, testUpdateCourseRecord, testUpdateModuleRecord} from './moduleRecordWorkerTestUtils'
import {
	getCourseRecordWithOneModuleRecord,
	getCourseRecordWithTwoModuleRecords,
	getCourseWithMixedModules,
	getCourseWithOneRequiredModule,
	getCourseWithTwoRequiredModules,
	mockTime,
	testDateAsStr,
	testUser,
} from './workerTestUtils'

describe('Should test the course action worker classes', () => {
	beforeEach(() => {
		mockTime()
	})

	afterEach(() => {
		sinon.restore()
	})

	describe('Should test completing a module', () => {
		describe('Should create course records', () => {
			it('Should create a completed course record when the course has 1 module', async () => {
				const course = getCourseWithOneRequiredModule("course 100", "module 100")
				const worker = new CompletedActionWorker(course, testUser, course.modules[0])
				await testCreateCourseRecord(worker, RecordState.Completed, undefined, RecordState.Completed, course)
			})

			it(`Should create a completed course record when the course has
                1 required module and 1 optional module and the required one is completed`, async () => {
				const course = getCourseWithMixedModules("course 100", "module 100", "module 101")
				const worker = new CompletedActionWorker(course, testUser, course.modules[1])
				await testCreateCourseRecord(worker, RecordState.Completed, undefined, RecordState.Completed, course)
			})

			it(`Should create an in progress course record when the course has
                2 required modules and one of them is completed`, async () => {
				const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
				const worker = new CompletedActionWorker(course, testUser, course.modules[0])
				await testCreateCourseRecord(worker, RecordState.InProgress, undefined, RecordState.Completed, course)
			})
		})

		it(`Should create a completed module record`, async () => {
			const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed
			)
			const worker = new CompletedActionWorker(course, testUser, course.modules[1])
			await testCreateModuleRecord(worker, courseRecord, RecordState.Completed, course.modules[1])
		})

		it(`Should complete the course record and module record
            when all relevant modules are now completed`, async () => {
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
			const worker = new CompletedActionWorker(course, testUser, course.modules[1])
			await testUpdateCourseRecord(worker, courseRecord, courseRecord.modules[1], [
				{op: 'replace', path: '/state', value: 'COMPLETED'},
			])
		})

		it(`Should set the course record to in progress when it has been
            removed/added from/to the learning plan and there are still
            module to complete`, async () => {
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
			const worker = new CompletedActionWorker(course, testUser, course.modules[1])
			await testUpdateCourseRecord(worker, courseRecord, courseRecord.modules[1], [
				{op: 'replace', path: '/state', value: 'IN_PROGRESS'},
			])
		})
	})

	describe('Should test initialising a module', () => {
		const course = getCourseWithTwoRequiredModules("course 100", "module 100", "module 101")

		it(`Should create the course record correctly`, async () => {
			const worker = new InitialiseActionWorker(course, testUser, course.modules[0])
			await testCreateCourseRecord(worker, RecordState.InProgress, undefined, RecordState.InProgress, course)
		})

		it(`Should create the course record correctly`, async () => {
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.Completed
			)
			const worker = new InitialiseActionWorker(course, testUser, course.modules[1])
			await testCreateModuleRecord(worker, courseRecord, RecordState.InProgress, course.modules[1])
		})

		it(`Should update the course record correctly after
            the course has been added/removed to/from the learning plan`, async () => {
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.Null,
				course.modules[0].id,
				RecordState.Completed
			)
			const worker = new InitialiseActionWorker(course, testUser, course.modules[0])
			await testUpdateCourseRecord(worker, courseRecord, courseRecord.modules[0], [
				{op: 'replace', path: '/state', value: 'IN_PROGRESS'},
			])
		})

		it(`Should update the patch record correctly if it is
            not already completed`, async () => {
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.Null,
				course.modules[0].id,
				RecordState.Null
			)
			const worker = new InitialiseActionWorker(course, testUser, course.modules[0])
			await testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/state', value: 'IN_PROGRESS'},
				{op: 'remove', path: '/result', value: undefined},
				{op: 'remove', path: '/score', value: undefined},
			])
		})
	})

	describe('Should test failing a module', () => {
		it(`Should correctly update the module record when
            a module is failed`, async () => {
			const course = getCourseWithOneRequiredModule("course 100", "module 100")
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.InProgress
			)
			const worker = new FailModuleActionWorker(course, testUser, course.modules[0])
			testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/result', value: 'FAILED'},
			])
		})
	})

	describe('Should test passing a module', () => {
		it(`Should correctly update the module record when
            a module is passed`, async () => {
			const course = getCourseWithOneRequiredModule("course 100", "module 100")
			const courseRecord = getCourseRecordWithOneModuleRecord(
				1,
				course.id,
				RecordState.InProgress,
				course.modules[0].id,
				RecordState.InProgress
			)
			const worker = new PassModuleActionWorker(course, testUser, course.modules[0])
			testUpdateModuleRecord(worker, courseRecord, [
				{op: 'replace', path: '/state', value: 'COMPLETED'},
				{op: 'replace', path: '/completionDate', value: testDateAsStr},
				{op: 'replace', path: '/result', value: 'PASSED'},
			])
		})
	})
})
