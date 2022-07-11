import { Course, User } from "../../../model";
import { setUpdatedAt, setResult } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { ModuleRecord, ModuleRecordResult } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";
import { InitialiseActionWorker } from "./initialiseActionWorker";

export class FailModuleActionWorker extends InitialiseActionWorker {
    constructor(
        readonly course: Course,
        readonly user: User,
        readonly moduleIdToUpdate: string
    ) {
        super(course, user, moduleIdToUpdate)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord) {
        const patches = []
        patches.push(...[
            setUpdatedAt(),
            setResult(ModuleRecordResult.Failed)
        ])
        return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }
}