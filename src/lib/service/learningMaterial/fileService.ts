import { Course, User } from "lib/model";
import { setModuleCompleted } from "../learnerRecord";

export async function completeFileModule(moduleId: string, user: User, course: Course) {

    setModuleCompleted(course, moduleId, user)

}