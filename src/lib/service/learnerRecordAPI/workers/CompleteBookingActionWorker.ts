import { Course, User, Module, Event } from "../../../model";
import { ModuleRecord } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";
import { setState, setUpdatedAt, setCompletionDate } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { setLastUpdated } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { CourseRecord } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { patchCourseRecord } from "../../learnerRecordAPI/courseRecord/client";
import { EventActionWorker } from "./EventActionWorker";
import { CourseRecordStateError } from "../../../exception/courseRecordStateError";

export class CompleteBookingActionWorker extends EventActionWorker {
    
    constructor(
        protected readonly course: Course,
        protected readonly user: User,
        protected readonly event: Event,
        protected readonly module: Module
        ) {
            super(course, user, event, module)
        }
    
    async createCourseRecord(): Promise<void> {
        const msg = `User ${this.user.id} attempted to record
        attendance against event ${this.event.id} but course record
        does not exist (course ${this.course.id}, module ${this.module.id})`
        throw new CourseRecordStateError(msg)
    }

    async createModuleRecord(): Promise<ModuleRecord> {
        const msg = `User ${this.user.id} attempted to record
        attendance against event ${this.event.id} but module record
        does not exist (course ${this.course.id}, module ${this.module.id})`
        throw new CourseRecordStateError(msg)
    }

    async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
        const patches = [setLastUpdated()]
        if (courseRecord.areAllRequiredModulesComplete(this.course.modules)) {
            patches.push(setState(RecordState.Completed))
        } else if (courseRecord.hasBeenAddedToLearningPlan() || courseRecord.hasBeenRemovedFromLearningPlan()) {
            patches.push(setState(RecordState.InProgress))
        }
        await patchCourseRecord(patches, this.user, this.course.id)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
        // Only approved event modules can have attendance registered against them
        if (moduleRecord.isApproved()) {
            const patches = [
                setUpdatedAt(),
                setState(RecordState.Completed),
                setCompletionDate(new Date())
            ]
            return await patchModuleRecord(patches, this.user, moduleRecord.id)
        } else {
            const msg = `User ${this.user.id} attempted to record
            attendance against event ${this.event.id} but module record
            has not been approved (course ${this.course.id}, module ${this.module.id})`
            throw new CourseRecordStateError(msg)
        }
    }

     
}