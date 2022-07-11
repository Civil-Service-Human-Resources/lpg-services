import { CourseRecordActionWorker } from "./CourseRecordActionWorker";
import { CourseRecordPreference } from "../../learnerRecordAPI/courseRecord/models/courseRecord";
import { User, Course } from "../../../model";
import { getLogger } from "../../../logger";

const logger = getLogger('fullLearnerRecord/workers/RemoveCourseFromSuggestionsActionWorker')

export class RemoveCourseFromSuggestionsActionWorker extends CourseRecordActionWorker {

    constructor(
        protected readonly course: Course,
        protected readonly user: User
    ) {
        super(course, user)
    }

    async updateCourseRecord() {
        logger.warn(`Attempted removal from suggested learning when course record exists (course: ${this.course.id}, user: ${this.user.id})`)
    }

    async createCourseRecord() {
        await this.createNewCourseRecord([], undefined, CourseRecordPreference.Disliked)
    }
}