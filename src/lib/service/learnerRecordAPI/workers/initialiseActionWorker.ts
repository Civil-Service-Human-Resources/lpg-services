import { ActionWorker } from "./ActionWorker";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { Course, User, Module } from "../../../model";
import { setState } from '../../learnerRecordAPI/courseRecord/patchFactory';
import { CourseRecord } from '../../learnerRecordAPI/courseRecord/models/courseRecord';
import { setUpdatedAt, setResult, setScore, setCompletionDate } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { patchCourseRecord } from "../../learnerRecordAPI/courseRecord/client";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { ModuleRecord } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";

export class InitialiseActionWorker extends ActionWorker {
    constructor(
        protected readonly course: Course,
        protected readonly user: User,
        protected readonly module: Module
    ) {
        super(course, user, module)
    }
    
    async createCourseRecord() {
        const moduleRecordInput = this.generateModuleRecordInput(RecordState.InProgress)
        await this.createNewCourseRecord([moduleRecordInput], RecordState.InProgress)
    }

    async createModuleRecord() {
        return await this.createNewModuleRecord(RecordState.InProgress)
    }

    async updateCourseRecord(courseRecord: CourseRecord) {
        const patches = []
        patches.push(setUpdatedAt())
        if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
            patches.push(setState(RecordState.InProgress))
        }
        await patchCourseRecord(patches, this.user, this.course.id)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord) {
        const patches = []
        if (!moduleRecord!.isCompleted()) {
            patches.push(...[
                setState(RecordState.InProgress),
                setResult(undefined),
                setScore(undefined),
                setCompletionDate(),
                setUpdatedAt(new Date())
            ])
        }
        return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }
}