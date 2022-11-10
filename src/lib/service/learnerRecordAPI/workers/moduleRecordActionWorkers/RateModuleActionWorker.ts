import {Course, Module, User} from '../../../../model'
import {patchModuleRecord} from '../../../learnerRecordAPI/moduleRecord/client'
import {ModuleRecord} from '../../../learnerRecordAPI/moduleRecord/models/moduleRecord'
import {setRated, setUpdatedAt} from '../../../learnerRecordAPI/moduleRecord/patchFactory'
import {WorkerType} from '../workerType'
import {InitialiseActionWorker} from './initialiseActionWorker'

export class RateModuleActionWorker extends InitialiseActionWorker {
	constructor(protected readonly course: Course, protected readonly user: User, protected readonly module: Module) {
		super(course, user, module)
	}

	async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = [setRated(true), setUpdatedAt(new Date())]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
	}

	protected getType(): WorkerType {
		return WorkerType.RATE_MODULE
	}
}
