import * as datetime from '../../../../../datetime'

export class LearningRecordCourse {
	public id: string
	public title: string
	public type: string
	public duration: string
	public completionDate: string

	getCompletionDateFormatted() {
		return datetime.formatDate(new Date(this.completionDate))
	}
}
