import { ModuleRecord } from "./moduleRecord";
import { Module } from "lib/model";
import { RecordState } from "./record";

export async function createInProgressModule(moduleData: Module, userId: string) {
    let inProgressModuleRecord = new ModuleRecord(moduleData, RecordState.InProgress, userId, new Date())
    return inProgressModuleRecord
}

