import { Course } from "lib/model";
import { CourseRecord } from "./courseRecord";
import { ModuleRecord } from "./moduleRecord";
import { RecordState } from "./record";

export function createInProgressCourseRecord(course: Course, userId: string, moduleRecords: ModuleRecord[]) {
    let inputData = {
        courseTitle: course.title,
        courseId: course.id,
        modules: moduleRecords,
        userId: userId,
        state: RecordState.InProgress,
        lastUpdated: new Date()
    }

    let completedCourseRecord = new CourseRecord(inputData)
    return completedCourseRecord
}

export function createCompletedCourseRecord(course: Course, userId: string, moduleRecords: ModuleRecord[]) {
    let inputData = {
        courseTitle: course.title,
        courseId: course.id,
        modules: moduleRecords,
        userId: userId,
        state: RecordState.Completed,
        lastUpdated: new Date()
    }

    let completedCourseRecord = new CourseRecord(inputData)
    return completedCourseRecord
}