export enum RecordState {
	Null = '',
	NotStarted = 'NOT_STARTED',
	Completed = 'COMPLETED',
	InProgress = 'IN_PROGRESS',
	Archived = 'ARCHIVED',
	Skipped = 'SKIPPED',
	Unregsitered = 'UNREGISTERED',
	Registered = 'REGISTERED',
	Approved = 'APPROVED',
	Booked = 'BOOKED',
}

export class Record {
	courseId: string
	userId: string
	state?: RecordState

	constructor(courseId: string, userId: string, state?: RecordState) {
		this.courseId = courseId
		this.userId = userId
		this.state = state
	}

	isStarted() {
		return this.state !== RecordState.NotStarted
	}

	isInProgress() {
		return this.state === RecordState.InProgress
	}

	isCompleted() {
		return this.state === RecordState.Completed
	}

	isArchived() {
		return this.state === RecordState.Archived
	}

	isSkipped() {
		return this.state === RecordState.Skipped
	}

	isUnregistered() {
		return this.state === RecordState.Unregsitered
	}

	isRegistered() {
		return this.state === RecordState.Registered
	}

	isApproved() {
		return this.state === RecordState.Approved
	}
}
