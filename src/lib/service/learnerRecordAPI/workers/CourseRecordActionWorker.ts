import { CourseRecord } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { CourseRecordInput } from "../../learnerRecordAPI/courseRecord/models/courseRecordInput";
import { ModuleRecordInput } from "../../learnerRecordAPI/moduleRecord/models/moduleRecordInput";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { Course, User } from "../../../model";
import { createCourseRecord, getCourseRecord, patchCourseRecord } from '../../learnerRecordAPI/courseRecord/client';
import { setLastUpdated } from "../../learnerRecordAPI/courseRecord/patchFactory";

/**
 * Generic worker class for when JUST the course record needs updating
 */
export abstract class CourseRecordActionWorker {
    constructor(
        protected readonly course: Course,
        protected readonly user: User,
    ) {}

    async applyActionToLearnerRecord() {
        const courseRecord = await getCourseRecord(this.course.id, this.user)
        if (!courseRecord) {
            await this.createCourseRecord()
        } else {
            await this.updateCourseRecord(courseRecord)
        }
    }

    createNewCourseRecord = async (moduleRecords: ModuleRecordInput[], state?: RecordState, preference?: string) => {
        const input = new CourseRecordInput(this.course.id, this.course.title, this.user.id, this.course.isRequired(), moduleRecords, state, preference)
        await createCourseRecord(input, this.user)
    }

    abstract createCourseRecord(): Promise<void>

    async updateCourseRecord(courseRecord: CourseRecord): Promise<void> {
        await patchCourseRecord([
            setLastUpdated(new Date())
        ], this.user, courseRecord.courseId)
    }
}