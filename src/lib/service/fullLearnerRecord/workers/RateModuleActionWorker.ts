import {User, Course} from '../../../model'
import { ModuleRecord } from '../../learnerRecordAPI/moduleRecord/models/moduleRecord';
import { setRated, setUpdatedAt } from '../../learnerRecordAPI/moduleRecord/patchFactory';
import { patchModuleRecord } from '../../learnerRecordAPI/moduleRecord/client';
import { InitialiseActionWorker } from './initialiseActionWorker';

export class RateModuleActionWorker extends InitialiseActionWorker {
	constructor(
		protected readonly course: Course,
		protected readonly user: User,
		protected readonly moduleId: string
	) {
		super(course, user, moduleId)
	}

    async updateModuleRecord(moduleRecord: ModuleRecord) {
		const patches = [
			setRated(true),
			setUpdatedAt(new Date())
		]
		return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }

	async updateCourseRecord() {}

	async createCourseRecord() {}
}
