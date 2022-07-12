import { Course, User, Module, Event } from "../../../model";
import { ModuleRecord } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";
import { setState, clearResult, clearScore, clearCompletionDate, setUpdatedAt, setEventId, setEventDate } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { setLastUpdated } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { CourseRecord } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { patchCourseRecord } from "../../learnerRecordAPI/courseRecord/client";
import { EventActionWorker } from "./EventActionWorker";

export class RegisterBookingActionWorker extends EventActionWorker {
    
    constructor(
        protected readonly course: Course,
        protected readonly user: User,
        protected readonly event: Event,
        protected readonly module: Module
        ) {
            super(course, user, event, module)
        }
        
    async createCourseRecord(): Promise<void> {
        const modules = [this.generateModuleRecordInput(RecordState.Registered)]
        await this.createNewCourseRecord(modules, RecordState.Registered)
    }

    async createModuleRecord(): Promise<ModuleRecord> {
        return await this.createNewModuleRecord(RecordState.Registered)
    }

    async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
        const patches = [
            setLastUpdated(new Date())
        ]
        if (courseRecord.isNull() || !courseRecord.isInProgress()) {
            patches.push(setState(RecordState.Registered))
        }
        await patchCourseRecord(patches, this.user, courseRecord.courseId)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
        const patches = [
            setState(RecordState.Registered),
            clearResult(),
            clearScore(),
            clearCompletionDate(),
            setEventId(this.event.id),
            setEventDate(this.event.dateRanges[0]),
            setUpdatedAt(new Date())
        ]
        return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }

     
}