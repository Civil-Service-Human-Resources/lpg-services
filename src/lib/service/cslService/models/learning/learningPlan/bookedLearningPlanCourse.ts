import {EventModule} from './eventModule'
import {LearningPlanCourse} from './learningPlanCourse'

export class BookedLearningPlanCourse extends LearningPlanCourse {
	public eventModule: EventModule
	public canBeMovedToLearningRecord: boolean = false
}
