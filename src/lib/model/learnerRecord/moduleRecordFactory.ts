import { ModuleRecord } from "./moduleRecord";
import { Module } from "lib/model";
import { RecordState } from "./record";

export async function createInProgressModuleRecord(moduleData: Module, userId: string) {
    let inProgressModuleRecord = new ModuleRecord(moduleData, RecordState.InProgress, userId, new Date())
    return inProgressModuleRecord
}

export async function createCompletedModuleRecord(moduleData: Module, userId: string) {
    let completedModuleRecord = new ModuleRecord(moduleData, RecordState.Completed, userId, new Date())
    completedModuleRecord.completionDate = new Date()
    return completedModuleRecord
}
