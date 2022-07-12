import { Course, User, Module } from "../../../model";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { setUpdatedAt, setCompletionDate, setResult } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { setState } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { ModuleRecord, ModuleRecordResult } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";
import { CompletedActionWorker } from "./CompletedActionWorker";

export class PassModuleActionWorker extends CompletedActionWorker {
    constructor(
        readonly course: Course,
        readonly user: User,
        readonly module: Module
    ) {
        super(course, user, module)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord) {
        const patches = []
        patches.push(...[
            setUpdatedAt(),
            setState(RecordState.Completed),
            setCompletionDate(new Date()),
            setResult(ModuleRecordResult.Passed)
        ])
        return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }
}