import { User, Course, Module, Event } from '../../../model';
import { RecordState } from '../../learnerRecordAPI/models/record';
import { ModuleRecordInput } from '../../learnerRecordAPI/moduleRecord/models/moduleRecordInput';
import { ActionWorker } from './ActionWorker';

export abstract class EventActionWorker extends ActionWorker {

    constructor(
        protected readonly course: Course,
        protected readonly user: User,
        protected readonly event: Event,
        protected readonly module: Module
        ) {
            super(course, user, module)
        }

    protected generateModuleRecordInput(state: RecordState) {
        return new ModuleRecordInput(this.user.userId, this.course.id, this.module.id,
            this.module.title, this.module.optional, this.module.type, this.module.duration,
            state, this.module.cost, this.event.id, this.event.dateRanges[0])
    }

}
