import { expect } from 'chai'
import * as sinon from 'sinon'

import { User, Course, Module } from '../../../../model'
import { IJsonPatch } from '../../../shared/models/JsonPatch'
import * as courseRecordClient from '../../courseRecord/client'
import { CourseRecord } from '../../courseRecord/models/courseRecord'
import * as moduleRecordClient from '../../moduleRecord/client'
import { ModuleRecord } from '../../moduleRecord/models/moduleRecord'
import { RecordState } from '../../models/record';

const testDate = new Date(2020, 0, 1, 0, 0, 0)
export const testDateAsStr = "2020-01-01T00:00:00"

export const testUser = new User("100", "TestUser", "", [], "")
export const testCourse = new Course('TEST001')

// Course data

export function getCourseWithOneRequiredModule() {
	const module = getRequiredModule()
	return genericCourse([module])
}

export function getCourseWithTwoRequiredModules() {
	const course = getCourseWithOneRequiredModule()
	course.modules.push(getRequiredModule())
	return course
}

export function getCourseWithOneOptionalModule() {
	const module = getOptionalModule()
	return genericCourse([module])
}

export function getCourseWithTwoOptionalModules() {
	const course = getCourseWithOneOptionalModule()
	course.modules.push(getOptionalModule())
}

/**
 * - module [0] is opt
 * - module [1] is required
 */
export function getCourseWithMixedModules() {
	const course = getCourseWithOneOptionalModule()
	course.modules.push(getRequiredModule())
	return course
}

export function genericCourse(modules: Module[]) {
	const courseId = "course " + Math.random().toString()
	let course = new Course(courseId)
	course.modules = modules
	return course
}

// Course record data

export function getCourseRecordWithOneModuleRecord(courseId: string, courseState: RecordState,
	moduleId: string, moduleState: RecordState) {
	const moduleRecord = createModuleRecord(moduleId, courseId, moduleState)
	let courseRecord = genericCourseRecord(courseId, [moduleRecord])
	courseRecord.state = courseState
	return courseRecord
}

export function getCourseRecordWithTwoModuleRecords(courseId: string, courseState: RecordState,
	moduleId: string, moduleState: RecordState, moduleTwoId: string, moduleTwoState: RecordState) {
	const moduleRecord = createModuleRecord(moduleId, courseId, moduleState)
	const moduleRecordTwo = createModuleRecord(moduleTwoId, courseId, moduleTwoState)
	let courseRecord = genericCourseRecord(courseId, [moduleRecord, moduleRecordTwo])
	courseRecord.state = courseState
	return courseRecord
}

export function genericCourseRecord(courseId: string, moduleRecords: ModuleRecord[]) {
	return new CourseRecord(
		courseId,
		testUser.id,
		undefined,
		moduleRecords,
		"Test course",
		false
	)
}

export function getRequiredModule() {
	return genericModule(false)
}

export function getOptionalModule() {
	return genericModule(true)
}

export function genericModule(optional: boolean) {
	const moduleId = "module " + Math.random().toString()
	let mod = new Module(moduleId, "elearning")
	mod.optional = optional
	return mod
}

export function createModuleRecord(moduleId: string, courseId: string, state: RecordState) {
	const _id = Math.random()
	return new ModuleRecord(
		_id,
		moduleId,
		testUser.id,
		courseId,
		new Date(),
		new Date(),
		"Test Module",
		"elearning",
		state,
		undefined,
		false,
		undefined
	)
}

export function genericModuleRecord() {
	return createModuleRecord("", "", RecordState.InProgress)
}

export function mockTime() {
	sinon.useFakeTimers(testDate.getTime())
}

// Assertion functions

export function assertOneCallAndGetArgs(stub: sinon.SinonStub) {
    expect(stub.calledOnce, `Expected function ${stub} to be called once, was called ${stub.callCount} times`).to.be.true
    return stub.firstCall.args
}

export function assertJsonPatch(patches: IJsonPatch[], expectedPatches: IJsonPatch[]) {
	for (let i = 0; i < expectedPatches.length; i++) {
        const expPatch = expectedPatches[i]
        const actualPatch = patches[i]
		expect(actualPatch).to.eql(expPatch, `expected patch op to be ${JSON.stringify(expPatch)} but was ${JSON.stringify(actualPatch)}`)
    }
}

// Course record mocks

export function mockPatchCourseRecord() {
	return sinon.stub(courseRecordClient, 'patchCourseRecord').returns(Promise.resolve())
}

export function mockCreateCourseRecord() {
	return sinon.stub(courseRecordClient, 'createCourseRecord').returns(Promise.resolve())
}

export function mockGetCourseRecord(returnVal: CourseRecord|undefined = undefined) {
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