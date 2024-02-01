/* tslint:disable:no-unused-expression */
import {expect} from 'chai'
import * as sinon from 'sinon'

import {Course, Event, Module, User} from '../../../../model'
import {JsonPatchInterface} from '../../../shared/models/JsonPatch'
import * as courseRecordClient from '../../courseRecord/client'
import {CourseRecord} from '../../courseRecord/models/courseRecord'
import {RecordState} from '../../models/record'
import * as moduleRecordClient from '../../moduleRecord/client'
import {ModuleRecord} from '../../moduleRecord/models/moduleRecord'

const testDate = new Date(2020, 0, 1, 0, 0, 0)
export const testDateAsStr = '2020-01-01T00:00:00'

export const testUser = new User('100', 'TestUser', [], '')
export const testCourse = new Course('TEST001')

// Course data

export function getCourseWithOneRequiredModule(courseId: string, moduleId: string) {
	const module = getRequiredModule(moduleId)
	return genericCourse(courseId, [module])
}

export function getCourseWithTwoRequiredModules(courseId: string, moduleOneId: string, moduleTwoId: string) {
	const course = getCourseWithOneRequiredModule(courseId, moduleOneId)
	course.modules.push(getRequiredModule(moduleTwoId))
	return course
}

export function getCourseWithOneOptionalModule(courseId: string, moduleId: string) {
	const module = getOptionalModule(moduleId)
	return genericCourse(courseId, [module])
}

export function getCourseWithTwoOptionalModules(courseId: string, moduleOneId: string, moduleTwoId: string) {
	const course = getCourseWithOneOptionalModule(courseId, moduleOneId)
	course.modules.push(getOptionalModule(moduleTwoId))
}

/**
 * - module [0] is opt
 * - module [1] is required
 */
export function getCourseWithMixedModules(courseId: string, moduleOneId: string, moduleTwoId: string) {
	const course = getCourseWithOneOptionalModule(courseId, moduleOneId)
	course.modules.push(getRequiredModule(moduleTwoId))
	return course
}

export function genericCourse(id: string, modules: Module[]) {
	const course = new Course(id)
	course.modules = modules
	return course
}

// Event data

export function genericEvent(id: string) {
	return new Event(new Date(), new Date(), [new Date()], 'Location', 10, 10, 'ACTIVE', id)
}

// Course record data

export function getCourseRecordWithOneModuleRecord(
	moduleRecordId: number,
	courseId: string,
	courseState: RecordState,
	moduleId: string,
	moduleState: RecordState
) {
	const moduleRecord = createModuleRecord(moduleRecordId, moduleId, courseId, moduleState)
	const courseRecord = genericCourseRecord(courseId, [moduleRecord])
	courseRecord.state = courseState
	return courseRecord
}

export function getCourseRecordWithTwoModuleRecords(
	moduleRecordId: number,
	moduleRecordTwoId: number,
	courseId: string,
	courseState: RecordState,
	moduleId: string,
	moduleState: RecordState,
	moduleTwoId: string,
	moduleTwoState: RecordState
) {
	const moduleRecord = createModuleRecord(moduleRecordId, moduleId, courseId, moduleState)
	const moduleRecordTwo = createModuleRecord(moduleRecordTwoId, moduleTwoId, courseId, moduleTwoState)
	const courseRecord = genericCourseRecord(courseId, [moduleRecord, moduleRecordTwo])
	courseRecord.state = courseState
	return courseRecord
}

export function genericCourseRecord(courseId: string, moduleRecords: ModuleRecord[]) {
	return new CourseRecord(courseId, testUser.id, undefined, moduleRecords, 'Test course', false)
}

// Module data

export function getRequiredModule(id: string) {
	return genericModule(id, false)
}

export function getOptionalModule(id: string) {
	return genericModule(id, true)
}

export function genericModule(id: string, optional: boolean) {
	const mod = new Module(id, 'elearning')
	mod.optional = optional
	return mod
}

// Module record data

export function createModuleRecord(moduleRecordId: number, moduleId: string, courseId: string, state: RecordState) {
	return new ModuleRecord(
		moduleRecordId,
		moduleId,
		testUser.id,
		courseId,
		new Date(),
		new Date(),
		'Test Module',
		'elearning',
		state,
		undefined,
		false,
		undefined
	)
}

export function genericModuleRecord(moduleRecordId: number) {
	return createModuleRecord(moduleRecordId, '', '', RecordState.InProgress)
}

export function getEventModuleRecord(
	moduleRecordId: number,
	moduleId: string,
	courseId: string,
	state: RecordState,
	eventId: string
) {
	const moduleRecord = createModuleRecord(moduleRecordId, moduleId, courseId, state)
	moduleRecord.eventId = eventId
	return moduleRecord
}

export function mockTime() {
	sinon.useFakeTimers(testDate.getTime())
}

// Assertion functions

export function assertOneCallAndGetArgs(stub: sinon.SinonStub) {
	expect(stub.calledOnce, `Expected function ${stub} to be called once, was called ${stub.callCount} times`).to.be.true
	return stub.firstCall.args
}

export function assertJsonPatch(patches: JsonPatchInterface[], expectedPatches: JsonPatchInterface[]) {
	for (let i = 0; i < expectedPatches.length; i++) {
		const expPatch = expectedPatches[i]
		const actualPatch = patches[i]
		expect(actualPatch).to.eql(
			expPatch,
			`expected patch op to be ${JSON.stringify(expPatch)} but was ${JSON.stringify(actualPatch)}`
		)
	}
}

// Course record mocks

export function mockPatchCourseRecord() {
	return sinon.stub(courseRecordClient, 'patchCourseRecord').returns(Promise.resolve())
}

export function mockCreateCourseRecord() {
	return sinon.stub(courseRecordClient, 'createCourseRecord').returns(Promise.resolve())
}

export function mockGetCourseRecord(returnVal?: CourseRecord | undefined) {
	return sinon.stub(courseRecordClient, 'getCourseRecord').returns(Promise.resolve(returnVal))
}

export function mockGetCourseRecordNotFound() {
	return mockGetCourseRecord(undefined)
}

// Module record mocks

export function mockCreateModuleRecord(returnModule: ModuleRecord) {
	return sinon.stub(moduleRecordClient, 'createModuleRecord').returns(Promise.resolve(returnModule))
}

export function mockPatchModuleRecord(returnModule: ModuleRecord) {
	return sinon.stub(moduleRecordClient, 'patchModuleRecord').returns(Promise.resolve(returnModule))
}
