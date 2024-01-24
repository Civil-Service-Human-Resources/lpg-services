import { expect } from 'chai'

import { User } from '../../../../model'
import { JsonPatch, JsonPatchInterface } from '../../../shared/models/JsonPatch'
import { CourseRecord } from '../../courseRecord/models/courseRecord'
import { ModuleRecord } from '../../moduleRecord/models/moduleRecord'
import { ActionWorker } from '../moduleRecordActionWorkers/ActionWorker'
import { assertPatchCourseRecordCall } from './courseRecordWorkerTestUtils'
import {
	assertJsonPatch, assertOneCallAndGetArgs, genericModuleRecord,
	mockGetCourseRecord, mockPatchCourseRecord, mockPatchModuleRecord, testUser
} from './workerTestUtils'
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
	const patchModuleRecordMock = mockPatchModuleRecord(genericModuleRecord(1))
	mockPatchCourseRecord()
	await worker.applyActionToLearnerRecord()
	assertPatchModuleRecordCall(patchModuleRecordMock, expectedPatches)
}
