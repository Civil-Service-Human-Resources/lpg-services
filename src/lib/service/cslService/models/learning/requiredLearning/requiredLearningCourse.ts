import * as moment from 'moment/moment'
import {LearningPlanCourse} from '../learningPlan/learningPlanCourse'

export class RequiredLearningCourse extends LearningPlanCourse {
	public dueBy: string

	getDueByDateFormatted() {
		return moment(this.dueBy).utc().format('DD MMM YYYY')
	}
}
