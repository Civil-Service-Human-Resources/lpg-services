import { expect } from 'chai'

import { Module, User } from '../../../../model'
import { JsonPatch, JsonPatchInterface } from '../../../shared/models/JsonPatch'
import { CourseRecord } from '../../courseRecord/models/courseRecord'
import { RecordState } from '../../models/record'
import { ModuleRecord } from '../../moduleRecord/models/moduleRecord'
import { ModuleRecordInput } from '../../moduleRecord/models/moduleRecordInput'
import { ActionWorker } from '../moduleRecordActionWorkers/ActionWorker'
import { assertPatchCourseRecordCall } from './courseRecordWorkerTestUtils'
import {
	assertJsonPatch, assertOneCallAndGetArgs, genericModuleRecord, mockCreateModuleRecord,
	mockGetCourseRecord, mockPatchCourseRecord, mockPatchModuleRecord, testUser
} from './workerTestUtils'

/**
 * Test the following scenario:
 * - Course record exists
 * - Module record does not exist
 * The module record should be created correctly
 */
export async function testCreateModuleRecord(
	worker: ActionWorker,
	getCourseRecordMockResponse: CourseRecord,
	expState: RecordState | undefined,
	expModuleDetails: Module
) {
	mockGetCourseRecord(getCourseRecordMockResponse)
	const createModuleRecordMock = mockCreateModuleRecord(genericModuleRecord())
	mockPatchCourseRecord()
	await worker.applyActionToLearnerRecord()
	assertCreateModuleRecordCall(createModuleRecordMock, expState, expModuleDetails)
}

export function assertCreateModuleRecordCall(
	stub: sinon.SinonStub,
	expState: RecordState | undefined,
	expModuleDetails: Module
) {
	const createModRecordArgs = assertOneCallAndGetArgs(stub)
	const input = createModRecordArgs[0] as ModuleRecordInput
	const userInput = createModRecordArgs[1] as User
	expect(userInput.id).to.eq(testUser.id, `Expected user ID to be ${testUser.id} but was ${userInput.id}`)
	const stateArg = input.state
	expect(stateArg).to.eq(expState)

	expect(input.cost).to.eq(expModuleDetails.cost)
	expect(input.duration).to.eq(expModuleDetails.duration)
	expect(input.moduleId).to.eq(expModuleDetails.id)
	expect(input.moduleTitle).to.eq(expModuleDetails.title)
	expect(input.moduleType).to.eq(expModuleDetails.type)
	expect(input.optional).to.eq(expModuleDetails.optional)
}

export function assertPatchModuleRecordCall(stub: sinon.SinonStub, expectedPatches: JsonPatchInterface[]) {
	const patchModuleRecordArgs = assertOneCallAndGetArgs(stub)
	const patchesArg = patchModuleRecordArgs[0] as JsonPatch[]
	const userArg = patchModuleRecordArgs[1] as User
	assertJsonPatch(patchesArg, expectedPatches)
	expect(userArg.userName).to.eq(testUser.userName)
}

export async function testUpdateCourseRecord(
	worker: ActionWorker,
	courseRecordReturnVal: CourseRecord,
	patchModuleRecordReturnVal: ModuleRecord,
	expectedPatches: JsonPatchInterface[]
) {
	mockGetCourseRecord(courseRecordReturnVal)
	mockPatchModuleRecord(patchModuleRecordReturnVal)
	const patchCourseRecordMock = mockPatchCourseRecord()
	await worker.applyActionToLearnerRecord()
	assertPatchCourseRecordCall(patchCourseRecordMock, expectedPatches)
}

export async function testUpdateModuleRecord(
	worker: ActionWorker,
	courseRecordReturnVal: CourseRecord,
	expectedPatches: JsonPatchInterface[]
) {
	mockGetCourseRecord(courseRecordReturnVal)
	const patchModuleRecordMock = mockPatchModuleRecord(genericModuleRecord())
	mockPatchCourseRecord()
	await worker.applyActionToLearnerRecord()
	assertPatchModuleRecordCall(patchModuleRecordMock, expectedPatches)
}