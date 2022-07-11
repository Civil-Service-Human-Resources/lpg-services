import { ActionWorker } from "./ActionWorker";
import { Course, User, Module } from "../../../model";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { CourseRecord } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { setUpdatedAt, setCompletionDate } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { setState, setLastUpdated } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { patchCourseRecord } from "../../learnerRecordAPI/courseRecord/client";
import { ModuleRecord } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";

export class CompletedActionWorker extends ActionWorker {
    constructor(
        readonly course: Course,
        readonly user: User,
        readonly moduleIdToUpdate: string
    ) {
        super(course, user, moduleIdToUpdate)
    }

    async createCourseRecord() {
        const mod = this.course.getModule(this.moduleIdToUpdate)
        const moduleRecordInput = this.generateModuleRecordInput(mod, RecordState.Completed)
        const courseRecordState = this.course.modules.length === 1 ? RecordState.Completed : RecordState.InProgress
        await this.createNewCourseRecord([moduleRecordInput], courseRecordState)
    }

    async createModuleRecord(module: Module) {
        return await this.createNewModuleRecord(module, RecordState.Completed)
    }

    async updateCourseRecord(courseRecord: CourseRecord) {
        const patches = [setLastUpdated()]
        if (courseRecord.areAllRequiredModulesComplete(this.course.modules)) {
            patches.push(setState(RecordState.Completed))
        } else if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
            patches.push(setState(RecordState.InProgress))
        }
        await patchCourseRecord(patches, this.user, this.course.id)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord) {
        const patches = [
            setUpdatedAt(),
            setState(RecordState.Completed),
            setCompletionDate(new Date())
        ]
        return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }
}