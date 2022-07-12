import { CourseRecordActionWorker } from "./CourseRecordActionWorker";
import { CourseRecordPreference } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { User, Course } from "../../../model";
import { setPreference, clearState, setLastUpdated } from "../../learnerRecordAPI/courseRecord/patchFactory";
import { patchCourseRecord } from "../../learnerRecordAPI/courseRecord/client";

export class AddCourseToLearningplanActionWorker extends CourseRecordActionWorker {

    constructor(
        protected readonly course: Course,
        protected readonly user: User
    ) {
        super(course, user)
    }

    async updateCourseRecord() {
        const patches = [
            setPreference(CourseRecordPreference.Liked),
            clearState(),
            setLastUpdated(new Date())
        ]
        await patchCourseRecord(patches, this.user, this.course.id)
    }

    async createCourseRecord() {
        await this.createNewCourseRecord([], undefined, CourseRecordPreference.Liked)
    }

}