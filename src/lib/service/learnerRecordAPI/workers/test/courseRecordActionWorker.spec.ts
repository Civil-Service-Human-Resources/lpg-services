import * as sinon from 'sinon'

import { CourseRecordPreference } from '../../courseRecord/models/courseRecord'
import { RecordState } from '../../models/record'
import {
	AddCourseToLearningplanActionWorker
} from '../courseRecordActionWorkers/AddCourseToLearningplanActionWorker'
import {
	RemoveCourseFromLearningplanActionWorker
} from '../courseRecordActionWorkers/RemoveCourseFromLearningplanActionWorker'
import {
	RemoveCourseFromSuggestionsActionWorker
} from '../courseRecordActionWorkers/RemoveCourseFromSuggestionsActionWorker'
import {
	createCourseRecordTest, testCreateCourseRecord, testUpdateCourseRecord, updateCourseRecordTest
} from './courseRecordWorkerTestUtils'
import {
	getCourseRecordWithOneModuleRecord, getCourseWithOneOptionalModule, mockTime, testDateAsStr,
	testUser
} from './workerTestUtils'

describe('Should test the course action worker classes', () => {
	beforeEach(() => {
		mockTime()
	})

	afterEach(() => {
		sinon.restore()
	})

	describe('Should test adding a course to the learning plan', () => {
		createCourseRecordTest(async () => {
			const course = getCourseWithOneOptionalModule()
			const worker = new AddCourseToLearningplanActionWorker(course, testUser)
			await testCreateCourseRecord(worker, undefined, CourseRecordPreference.Liked, RecordState.Null, course)
		})

		updateCourseRecordTest(async () => {
			const course = getCourseWithOneOptionalModule()
			const worker = new AddCourseToLearningplanActionWorker(course, testUser)
			const courseRecord = getCourseRecordWithOneModuleRecord(
				course.id,
				RecordState.Null,
				course.modules[0].id,
				RecordState.InProgress
			)
			await testUpdateCourseRecord(worker, courseRecord, [
				{op: 'replace', path: '/preference', value: 'LIKED'},
				{op: 'remove', path: '/state', value: undefined},
				{op: 'replace', path: '/lastUpdated', value: testDateAsStr},
			])
		})
	})

	describe('Should test removing a course from the learning plan', () => {
		updateCourseRecordTest(async () => {
			const course = getCourseWithOneOptionalModule()
			const courseRecord = getCourseRecordWithOneModuleRecord(
				course.id,
				RecordState.Completed,
				course.modules[0].id,
				RecordState.InProgress
			)
			const worker = new RemoveCourseFromLearningplanActionWorker(course, testUser)
			await testUpdateCourseRecord(worker, courseRecord, [
				{op: 'replace', path: '/state', value: 'ARCHIVED'},
				{op: 'replace', path: '/lastUpdated', value: testDateAsStr},
			])
		})

		createCourseRecordTest(async () => {
			const course = getCourseWithOneOptionalModule()
			const worker = new RemoveCourseFromLearningplanActionWorker(course, testUser)
			await testCreateCourseRecord(worker, RecordState.Archived, undefined, undefined, course)
		})
	})

	describe('Should test removing a course from suggested learning', () => {
		createCourseRecordTest(async () => {
			const course = getCourseWithOneOptionalModule()
			const worker = new RemoveCourseFromSuggestionsActionWorker(course, testUser)
			await testCreateCourseRecord(worker, undefined, CourseRecordPreference.Disliked, undefined, course)
		})
	})
})
