import { Course, User, Module, Event } from "../../../model";
import { ModuleRecord, BookingStatus } from "../../learnerRecordAPI/moduleRecord/models/moduleRecord";
import { setState, clearResult, clearScore, clearCompletionDate, setUpdatedAt, setBookingStatus } from "../../learnerRecordAPI/moduleRecord/patchFactory";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { setLastUpdated } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { patchModuleRecord } from "../../learnerRecordAPI/moduleRecord/client";
import { CourseRecord } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { patchCourseRecord } from "../../learnerRecordAPI/courseRecord/client";
import { EventActionWorker } from "./EventActionWorker";

export class CancelBookingActionWorker extends EventActionWorker {
    
    constructor(
        protected readonly course: Course,
        protected readonly user: User,
        protected readonly event: Event,
        protected readonly module: Module
        ) {
            super(course, user, event, module)
        }
        
    async createCourseRecord(): Promise<void> {
        const modRecord = this.generateModuleRecordInput(RecordState.Unregsitered)
        await this.createNewCourseRecord([modRecord], RecordState.Unregsitered)
    }

    async createModuleRecord(): Promise<ModuleRecord> {
        return await this.createNewModuleRecord(RecordState.Registered)
    }

    async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
        const patches = [
            setLastUpdated(new Date())
        ]
        if (courseRecord.isNull() || !courseRecord.isInProgress()) {
            patches.push(setState(RecordState.Unregsitered))
        }
        await patchCourseRecord(patches, this.user, courseRecord.courseId)
    }

    async updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord> {
        const patches = [
            setState(RecordState.Unregsitered),
            clearResult(),
            clearScore(),
            clearCompletionDate(),
            setUpdatedAt(new Date()),
            setBookingStatus(BookingStatus.Cancelled)
        ]
        return await patchModuleRecord(patches, this.user, moduleRecord.id)
    }

     
}