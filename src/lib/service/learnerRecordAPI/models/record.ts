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
	state?: RecordState
	userId?: string

	constructor(state?: RecordState, userId?: string) {
		this.state = state
		this.userId = userId
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
