import { Course, User } from "lib/model";
import * as learnerRecordApi from 'lib/client/learnerrecord'
import { createCompletedModuleRecord, createInProgressModuleRecord } from "lib/model/learnerRecord/moduleRecordFactory";
import { createCompletedCourseRecord, createInProgressCourseRecord } from "lib/model/learnerRecord/courseRecordFactory";
import { CourseRecord } from "lib/model/learnerRecord/courseRecord";
import { ModuleRecord } from "lib/model/learnerRecord/moduleRecord";

// export function setModuleInProgress(course: Course, moduleId: String, userId: String) {
//     return null
// }

export async function setModuleInProgress(
                                        course: Course,
                                        moduleId: string,
                                        user: User) {
    let courseRecord = await learnerRecordApi.getCourseRecord(course.id, user)
    let module = course.getModule(moduleId)
    if (module === undefined) {
        throw Error("Module doesn't exist within course")
    }

    // Has the course been started by the user?
    if (courseRecord == null) {
        // No, so let's create the course record and module record
        let newModuleRecord = await createInProgressModuleRecord(module, user.id)
        let newCourseRecord = await createInProgressCourseRecord(course, user.id, [newModuleRecord])
        learnerRecordApi.createCourseRecord(newCourseRecord)
    } else {
        // Yes, does the module already exist?
        let moduleRecord = courseRecord.getModuleRecord(moduleId)
        if (moduleRecord == null) {
            // No, let's create an in progress record for it
            let newModuleRecord = await createInProgressModuleRecord(module, user.id)
            learnerRecordApi.createModuleRecord(newModuleRecord)

        }
    }
}

function getCourseRecord() {
    let newCourseRecord = null
    // WIll this completed update complete the course?
    if (course.getModules().length === 1) {
        newCourseRecord = createCompletedCourseRecord(course, user.id, [newModuleRecord])
    } else {
        newCourseRecord = createInProgressCourseRecord(course, user.id, [newModuleRecord])
    }
}

export async function setModuleCompleted(course: Course, moduleId: string, user: User) {
    let courseRecord = await learnerRecordApi.getCourseRecord(course.id, user)
    let module = course.getModule(moduleId)
    if (module === undefined) {
        throw Error("Module doesn't exist within course")
    }

    // Has the course been started by the user?
    if (courseRecord == null) {
        // No, so let's create the course record and module record
        let newModuleRecord = await createCompletedModuleRecord(module, user.id)
        let newCourseRecord = null
        // WIll this completed update complete the course?
        if (course.getModules().length === 1) {
            newCourseRecord = createCompletedCourseRecord(course, user.id, [newModuleRecord])
        } else {
            newCourseRecord = createInProgressCourseRecord(course, user.id, [newModuleRecord])
        }
        learnerRecordApi.createCourseRecord(newCourseRecord)

    } else {
        // Yes, does the module already exist?
        let moduleRecord = courseRecord.getModuleRecord(moduleId)
        if (moduleRecord == null) {
            // No, let's create an in progress record for it
            let newModuleRecord = await createCompletedModuleRecord(module, user.id)
            learnerRecordApi.createModuleRecord(newModuleRecord)

            // WIll this completed update complete the course?
            let courseModuleRecords =  courseRecord.modules
            courseModuleRecords.push(newModuleRecord)

            let numberOfCompletedModules = courseModuleRecords.filter(m => m.isCompleted()).length
            let totalCourseModules = course.getModules().length

            let newCourseRecord = null
            if (numberOfCompletedModules === totalCourseModules) {
                newCourseRecord = createCompletedCourseRecord(course, user.id, [newModuleRecord])
            } else {
                newCourseRecord = createInProgressCourseRecord(course, user.id, [newModuleRecord])
            }

            learnerRecordApi.patchCourseRecord(newCourseRecord)
        }
    }
}

async function checkIfCompletedModuleWillCompleteCourse(course: Course, courseRecord: CourseRecord, newCompletedModule: ModuleRecord) {
    

}

async function checkCompleteCourse(course: Course, ) {
    learnerRecordApi.
}
