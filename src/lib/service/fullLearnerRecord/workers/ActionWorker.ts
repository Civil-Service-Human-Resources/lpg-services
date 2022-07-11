import { createModuleRecord } from '../../learnerRecordAPI/moduleRecord/client';
import { User, Course, Module } from '../../../model';
import { RecordState } from '../../learnerRecordAPI/models/record';
import { ModuleRecordInput } from '../../learnerRecordAPI/moduleRecord/models/moduleRecordInput';
import { ModuleRecord } from '../../learnerRecordAPI/moduleRecord/models/moduleRecord';
import { getCourseRecord } from '../../learnerRecordAPI/courseRecord/client';
import { CourseRecordActionWorker } from './CourseRecordActionWorker';

export abstract class ActionWorker extends CourseRecordActionWorker {
	constructor(
        protected readonly course: Course,
        protected readonly user: User,
        protected readonly moduleIdToUpdate: string
    ) {
        super(course, user)
     }

    async applyActionToLearnerRecord() {
        const courseRecord = await getCourseRecord(this.course.id, this.user)
        if (!courseRecord) {
            await this.createCourseRecord()
        } else {
            let moduleRecord = courseRecord.getModuleRecord(this.moduleIdToUpdate)
            const module = this.course.getModule(this.moduleIdToUpdate)
            if (!moduleRecord) {
                moduleRecord = await this.createModuleRecord(module)
            } else {
                moduleRecord = await this.updateModuleRecord(moduleRecord)
            }
            courseRecord.updateModuleRecord(moduleRecord.id, moduleRecord)
            await this.updateCourseRecord(courseRecord)
        }
    }

    createNewModuleRecord = async (mod: Module, state: RecordState) => {
        const input = this.generateModuleRecordInput(mod, state)
        return await createModuleRecord(input, this.user)
    }

    protected generateModuleRecordInput(mod: Module, state: RecordState) {
        return new ModuleRecordInput(this.user.userId, this.course.id, mod.id, mod.title, mod.optional, mod.type, mod.duration, state, mod.cost)
    }

    abstract createModuleRecord(module: Module): Promise<ModuleRecord>

    abstract updateModuleRecord(moduleRecord: ModuleRecord): Promise<ModuleRecord>
}
