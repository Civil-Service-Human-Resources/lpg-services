import { Course, User } from "lib/model";
import * as courseCatalogueApi from "../catalog";
import * as learnerRecordApi from 'lib/client/learnerrecord'
import { createInProgressModule } from "lib/model/learnerRecord/moduleRecordFactory";

export function setModuleInProgress(course: Course, moduleId: String, userId: String) {

}

export async function setModuleInProgress(
                                        courseId: string,
                                        moduleId: string,
                                        user: User) {
    let course = await courseCatalogueApi.get(courseId, user)
    if (course != undefined) {
        let courseRecord = await learnerRecordApi.getCourseRecord(course.id, user)
        // Has the course been started by the user?
        if (courseRecord == null) {
            // No, so let's create the course record and module record

        } else {
            // Yes, does the module already exist?
            let moduleRecord = courseRecord.getModuleRecord(moduleId)
            if (moduleRecord == null) {
                // No, let's create an in progress record for it
                let moduleData = course.getModules().filter(m => m.id === moduleId)[0]
                let newModuleRecord = await createInProgressModule(moduleData, user.id)
                learnerRecordApi.createModuleRecord(newModuleRecord)
            }
        }
    }
}

export function setModuleCompleted(course: Course, moduleId: String, userId: String) {

}