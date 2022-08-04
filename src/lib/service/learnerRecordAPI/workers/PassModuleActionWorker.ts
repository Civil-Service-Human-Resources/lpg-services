import { Course, Module, User } from '../../../model'
import { setState } from '../../learnerRecordAPI/courseRecord/patchFactory'
import { RecordState } from '../../learnerRecordAPI/models/record'
import { patchModuleRecord } from '../../learnerRecordAPI/moduleRecord/client'
import {
	ModuleRecord, ModuleRecordResult
} from '../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {
	setCompletionDate, setResult, setUpdatedAt
} from '../../learnerRecordAPI/moduleRecord/patchFactory'
import { CompletedActionWorker } from './CompletedActionWorker'

export class PassModuleActionWorker extends CompletedActionWorker {
	constructor(readonly course: Course, readonly user: User, readonly module: Module) {
		super(course, user, module)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = []
		patches.push(
			...[
				setUpdatedAt(),
				setState(RecordState.Completed),
				setCompletionDate(new Date()),
				setResult(ModuleRecordResult.Passed),
			]
		)
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}
}
