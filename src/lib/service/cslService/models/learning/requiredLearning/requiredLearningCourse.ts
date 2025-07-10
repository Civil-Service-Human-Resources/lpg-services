import * as moment from 'moment/moment'
import * as datetime from '../../../../../datetime'
import {CourseType} from '../../../../../model'
import {RecordState} from '../../record'

export class RequiredLearningCourse {
	id: string
	title: string
	shortDescription: string
	type: CourseType
	moduleCount: number
	status: RecordState
	duration: number
	dueBy: string

	getDueByDateFormatted() {
		return moment(this.dueBy).utc().format('DD MMM YYYY')
	}

	getDurationFormatted() {
		if (this.duration) {
			return datetime.formatCourseDuration(this.duration)
		} else {
			return '-'
		}
	}
}
