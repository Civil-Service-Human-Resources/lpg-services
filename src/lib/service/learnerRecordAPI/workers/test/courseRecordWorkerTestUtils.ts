/* tslint:disable:no-unused-expression */
import {ActionWorker} from 'lib/service/learnerRecordAPI/workers/moduleRecordActionWorkers/ActionWorker'

import {SinonStub} from '../../../../../../node_modules/@types/sinon'
import {JsonPatch, JsonPatchInterface} from '../../../shared/models/JsonPatch'
import {CourseRecord} from '../../courseRecord/models/courseRecord'
import {
	assertJsonPatch,
	assertOneCallAndGetArgs,
	mockGetCourseRecord,
	mockPatchCourseRecord,
} from './workerTestUtils'

export function assertPatchCourseRecordCall(stub: SinonStub, expectedPatches: JsonPatchInterface[]) {
	const args = assertOneCallAndGetArgs(stub)
	const patchesArg = args[0] as JsonPatch[]
	assertJsonPatch(patchesArg, expectedPatches)
}

export async function testUpdateCourseRecord(
	worker: ActionWorker,
	getCourseRecordMockResponse: CourseRecord,
	expectedPatches: JsonPatchInterface[]
) {
	mockGetCourseRecord(getCourseRecordMockResponse)
	const patchCourseRecordMock = mockPatchCourseRecord()
	await worker.applyActionToLearnerRecord()
	assertPatchCourseRecordCall(patchCourseRecordMock, expectedPatches)
}
