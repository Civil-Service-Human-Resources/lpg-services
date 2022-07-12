import { Course, User, Module, Event } from "../../../model";
import { ModuleRecord } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";
import { setState, clearResult, clearScore, clearCompletionDate, clearBookingStatus } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { setLastUpdated } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { CourseRecord } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { patchCourseRecord } from "../../learnerRecordAPI/courseRecord/client";
import { EventActionWorker } from "./EventActionWorker";
import { CourseRecordStateError } from "../../../exception/courseRecordStateError";

export class SkipBookingActionWorker extends EventActionWorker {
    
    constructor(
        protected readonly course: Course,
        protected readonly user: User,
        protected readonly event: Event,
        protected readonly module: Module
        ) {
            super(course, user, event, module)
        }
        
    async createCourseRecord(): Promise<void> {
        const msg = `User ${this.user.id} attempted to skip
        event ${this.event.id} but a course record does not exist
        (course ${this.course.id}, module ${this.module.id})`
        throw new CourseRecordStateError(msg)
    }

    async createModuleRecord(): Promise<ModuleRecord> {
        const msg = `User ${this.user.id} attempted to skip
        event ${this.event.id} but a module record
        does not exist (course ${this.course.id}, module ${this.module.id})`
        throw new CourseRecordStateError(msg)
    }

    async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
        const patches = [
            setLastUpdated(new Date())
        ]
        if (courseRecord.isRegistered()) {
            patches.push(setState(RecordState.Skipped))
        }
        await patchCourseRecord(patches, this.user, courseRecord.courseId)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
        const patches = [
            setState(RecordState.Skipped),
            clearBookingStatus(),
            clearResult(),
            clearScore(),
            clearCompletionDate()
        ]
        return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }

     
}