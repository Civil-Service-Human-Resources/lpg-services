import * as sinon from 'sinon'

import { RecordState } from '../../models/record'
import { CompletedActionWorker } from '../CompletedActionWorker'
import { testCreateCourseRecord } from './courseRecordWorkerTestUtils.spec'
import { testCreateModuleRecord, testUpdateCourseRecord } from './moduleRecordWorkerTestUtils.spec'
import {
    getCourseRecordWithTwoModuleRecords, getCourseWithMixedModules, getCourseWithOneRequiredModule,
    getCourseWithTwoRequiredModules, mockTime, testDateAsStr, testUser, getCourseRecordWithOneModuleRecord
} from './workerTestUtils.spec'

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
                const course = getCourseWithOneRequiredModule()
                const expModuleState = [RecordState.Completed]
                const worker = new CompletedActionWorker(course, testUser, course.modules[0])
                await testCreateCourseRecord(worker, RecordState.Completed, undefined, expModuleState)
            })
    
            it(`Should create a completed course record when the course has
                1 required module and 1 optional module and the required one is completed`, async () => {
                const course = getCourseWithMixedModules()
                const expModuleState = [RecordState.Completed]
                const worker = new CompletedActionWorker(course, testUser, course.modules[1])
                await testCreateCourseRecord(worker, RecordState.Completed, undefined, expModuleState)
            })
    
            it(`Should create an in progress course record when the course has
                2 required modules and one of them is completed`, async () => {
                const course = getCourseWithTwoRequiredModules()
                const expModuleState = [RecordState.Completed]
                const worker = new CompletedActionWorker(course, testUser, course.modules[0])
                await testCreateCourseRecord(worker, RecordState.InProgress, undefined, expModuleState)
            })
        })

        it(`Should create a completed module record`, async () => {
            const course = getCourseWithTwoRequiredModules()
            const courseRecord = getCourseRecordWithOneModuleRecord(course.id, RecordState.InProgress,
                course.modules[0].id, RecordState.Completed)
            const worker = new CompletedActionWorker(course, testUser, course.modules[1])
            await testCreateModuleRecord(worker, courseRecord, RecordState.Completed)
        })

        it(`Should complete the course record and module record
            when all relevant modules are now completed`, async () => {
            const course = getCourseWithTwoRequiredModules()
            const courseRecord = getCourseRecordWithTwoModuleRecords(
                course.id, RecordState.InProgress, course.modules[0].id, RecordState.Completed,
                course.modules[1].id, RecordState.Completed
            )
            const worker = new CompletedActionWorker(course, testUser, course.modules[1])
            await testUpdateCourseRecord(
                worker,
                courseRecord,
                courseRecord.modules[1],
                [
                    {op: 'replace', path: '/lastUpdated', value: testDateAsStr},
                    {op: 'replace', path: '/state', value: 'COMPLETED'}
                ],
            )
        })

        it(`Should set the course record to in progress when it has been
            removed/added from/to the learning plan and there are still
            module to complete`, async () => {
            const course = getCourseWithTwoRequiredModules()
            const courseRecord = getCourseRecordWithTwoModuleRecords(
                course.id, RecordState.Null, course.modules[0].id, RecordState.InProgress,
                course.modules[1].id, RecordState.InProgress
            )
            const worker = new CompletedActionWorker(course, testUser, course.modules[1])
            await testUpdateCourseRecord(
                worker,
                courseRecord,
                courseRecord.modules[1],
                [
                    {op: 'replace', path: '/lastUpdated', value: testDateAsStr},
                    {op: 'replace', path: '/state', value: 'IN_PROGRESS'}
                ],
            )
        })
	})


})