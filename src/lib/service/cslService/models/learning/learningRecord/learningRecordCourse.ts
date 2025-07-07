import {Transform} from 'class-transformer'
import * as datetime from '../../../../../datetime'

export class LearningRecordCourse {
	public id: string
	public title: string
	public type: string

	@Transform(({value}) => {
		if (value) {
			return datetime.formatCourseDuration(parseInt(value))
		} else {
			return '-'
		}
	})
	public duration: string

	@Transform(({value}) => {
		return datetime.formatDate(new Date(value))
	})
	public completionDate: string
}
