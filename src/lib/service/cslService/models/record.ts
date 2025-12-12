export type RecordState =
	| ''
	| 'NULL'
	| 'COMPLETED'
	| 'IN_PROGRESS'
	| 'ARCHIVED'
	| 'SKIPPED'
	| 'REQUESTED'
	| 'UNREGISTERED'
	| 'REGISTERED'
	| 'APPROVED'
	| 'BOOKED'

export class Record {
	courseId: string
	userId: string
	state: RecordState

	constructor(courseId: string, userId: string, state: RecordState) {
		this.courseId = courseId
		this.userId = userId
		this.state = state
	}

	isInProgress() {
		return this.state === 'IN_PROGRESS'
	}

	isCompleted() {
		return this.state === 'COMPLETED'
	}

}
