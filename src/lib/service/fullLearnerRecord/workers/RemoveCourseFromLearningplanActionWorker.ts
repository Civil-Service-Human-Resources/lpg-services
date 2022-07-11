import { CourseRecordActionWorker } from "./CourseRecordActionWorker";
import { User, Course } from "../../../model";
import { setLastUpdated, setState } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { RecordState } from "../../learnerRecordAPI/models/record";
import { CourseRecord } from "../../learnerRecordAPI/courseRecord/models/courseRecord";

export class RemoveCourseFromLearningplanActionWorker extends CourseRecordActionWorker {

    constructor(
        protected readonly course: Course,
        protected readonly user: User
    ) {
        super(course, user)
    }

    async updateCourseRecord(courseRecord: CourseRecord) {
        if (!courseRecord.hasBeenAddedToLearningPlan()) {
            const patches = []
            patches.push(...[
                setState(RecordState.Archived),
                setLastUpdated(new Date())
            ])
        }
    }

    async createCourseRecord() { }

}