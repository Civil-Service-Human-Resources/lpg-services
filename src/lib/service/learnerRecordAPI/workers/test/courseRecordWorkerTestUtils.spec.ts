/* tslint:disable:no-unused-expression */
import { expect } from 'chai'

import { SinonStub } from '../../../../../../node_modules/@types/sinon'
import { Course } from '../../../../model'
import { JsonPatch, JsonPatchInterface } from '../../../shared/models/JsonPatch'
import { CourseRecord } from '../../courseRecord/models/courseRecord'
import { CourseRecordInput } from '../../courseRecord/models/courseRecordInput'
import { RecordState } from '../../models/record'
import { ModuleRecordInput } from '../../moduleRecord/models/moduleRecordInput'
import { CourseRecordActionWorker } from '../courseRecordActionWorkers/CourseRecordActionWorker'
import {
	assertJsonPatch, assertOneCallAndGetArgs, mockCreateCourseRecord, mockGetCourseRecord,
	mockGetCourseRecordNotFound, mockPatchCourseRecord
} from './WorkerTestUtils.spec'

/**
 * Test template for creating a course record
 */
export function createCourseRecordTest(testFunc: Mocha.Func, extraDesc: string = '') {
	return it('Should create the course record with correct data' + extraDesc, testFunc)
}

/**
 * Test template for updating a course record
 */
export function updateCourseRecordTest(testFunc: Mocha.Func, extraDesc: string = '') {
	return it('Should update the course record with correct data' + extraDesc, testFunc)
}

export async function testCreateCourseRecord(
	worker: CourseRecordActionWorker,
	expState: RecordState | undefined,
	expPrefernce: string | undefined,
	expModuleRecordState: RecordState | undefined,
	expCourseDetails: Course
) {
	mockGetCourseRecordNotFound()
	const createCourseRecordMock = mockCreateCourseRecord()
	await worker.applyActionToLearnerRecord()
	assertCreateCourseRecordCall(createCourseRecordMock, expState, expPrefernce, expModuleRecordState, expCourseDetails)
}

export function assertCreateCourseRecordCall(
	stub: SinonStub,
	expState: RecordState | undefined,
	expPrefernce: string | undefined,
	expModuleRecordState: RecordState | undefined,
	expCourseDetails: Course
) {
	const args = assertOneCallAndGetArgs(stub)
	const input = args[0] as CourseRecordInput

	const stateArg = input.state
	const preferenceArg = input.preference
	const modRecordArgs = input.moduleRecords as ModuleRecordInput[]
	expect(stateArg).to.eq(expState, `Expected course record state to be ${expState} but was ${stateArg}`)
	expect(preferenceArg).to.eq(
		expPrefernce,
		`Expected course record preference to be ${expPrefernce} but was ${preferenceArg}`
	)
	if (expModuleRecordState) {
		const modRec = modRecordArgs[0]
		const expModRecState = expModuleRecordState
		expect(modRec.state).to.eq(
			expModRecState,
			`Expected module record state to be ${expModRecState} but was ${modRec.state}`
		)
	} else {
		expect(modRecordArgs).to.be.empty
	}

	expect(input.courseId).to.eq(expCourseDetails.id)
	expect(input.courseTitle).to.eq(expCourseDetails.title)
	expect(input.isRequired).to.eq(expCourseDetails.isRequired())
}

export function assertPatchCourseRecordCall(stub: SinonStub, expectedPatches: JsonPatchInterface[]) {
	const args = assertOneCallAndGetArgs(stub)
	const patchesArg = args[0] as JsonPatch[]
	assertJsonPatch(patchesArg, expectedPatches)
}

export async function testUpdateCourseRecord(
	worker: CourseRecordActionWorker,
	getCourseRecordMockResponse: CourseRecord,
	expectedPatches: JsonPatchInterface[]
) {
	mockGetCourseRecord(getCourseRecordMockResponse)
	const patchCourseRecordMock = mockPatchCourseRecord()
	await worker.applyActionToLearnerRecord()
	assertPatchCourseRecordCall(patchCourseRecordMock, expectedPatches)
}
