import { expect } from 'chai'

import { IJsonPatch, JsonPatch } from '../../../shared/models/JsonPatch'
import { RecordState } from '../../models/record'
import { mockPatchCourseRecord, testUser, mockGetCourseRecord, mockPatchModuleRecord, mockCreateModuleRecord, assertJsonPatch, genericModuleRecord, assertOneCallAndGetArgs } from './WorkerTestUtils.spec'
import { User } from '../../../../model';
import { CourseRecord } from '../../courseRecord/models/courseRecord';
import { ActionWorker } from '../ActionWorker';
import { ModuleRecordInput } from '../../moduleRecord/models/moduleRecordInput';
import { assertPatchCourseRecordCall } from './courseRecordWorkerTestUtils.spec';
import { ModuleRecord } from '../../moduleRecord/models/moduleRecord';


/**
 * Test the following scenario:
 * - Course record exists
 * - Module record does not exist
 * The module record should be created correctly
 */
export async function testCreateModuleRecord(worker: ActionWorker, getCourseRecordMockResponse: CourseRecord, expState: RecordState|undefined) {
    mockGetCourseRecord(getCourseRecordMockResponse)
    const createModuleRecordMock = mockCreateModuleRecord(genericModuleRecord())
    mockPatchCourseRecord()
    await worker.applyActionToLearnerRecord()
    assertCreateModuleRecordCall(createModuleRecordMock, expState)
}

export function assertCreateModuleRecordCall(stub: sinon.SinonStub, expState: RecordState|undefined) {
    const createModRecordArgs = assertOneCallAndGetArgs(stub)
    const input = createModRecordArgs[0] as ModuleRecordInput
    const userInput = createModRecordArgs[1] as User
    expect(userInput.id).to.eq(testUser.id, `Expected user ID to be ${testUser.id} but was ${userInput.id}`)
    const stateArg = input.state
    expect(stateArg).to.eq(expState)
}

export function assertPatchModuleRecordCall(stub: sinon.SinonStub, expectedPatches: IJsonPatch[]) {
    const patchModuleRecordArgs = assertOneCallAndGetArgs(stub)
    const patchesArg = patchModuleRecordArgs[0] as JsonPatch[]
    const userArg = patchModuleRecordArgs[1] as User
    assertJsonPatch(patchesArg, expectedPatches)
    expect(userArg.userName).to.eq(testUser.userName)
}

export async function testUpdateCourseRecord(worker: ActionWorker,
    courseRecordReturnVal: CourseRecord,
    patchModuleRecordReturnVal: ModuleRecord,
    expectedPatches: IJsonPatch[]){
    mockGetCourseRecord(courseRecordReturnVal)
    mockPatchModuleRecord(patchModuleRecordReturnVal)
    const patchCourseRecordMock = mockPatchCourseRecord()
    await worker.applyActionToLearnerRecord()
    assertPatchCourseRecordCall(patchCourseRecordMock, expectedPatches)
}

export async function testUpdateModuleRecord(worker: ActionWorker,
    courseRecordReturnVal: CourseRecord,
    expectedPatches: IJsonPatch[]) {
    mockGetCourseRecord(courseRecordReturnVal)
    const patchModuleRecordMock = mockPatchModuleRecord(genericModuleRecord())
    mockPatchCourseRecord()
    await worker.applyActionToLearnerRecord()
    assertPatchModuleRecordCall(patchModuleRecordMock, expectedPatches)
}