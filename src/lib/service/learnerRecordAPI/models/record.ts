import { BookingStatus } from "../moduleRecord/models/moduleRecord"

export enum RecordState {
	Null = '',
	NotStarted = 'NOT_STARTED',
	Completed = 'COMPLETED',
	InProgress = 'IN_PROGRESS',
	Archived = 'ARCHIVED',
	Skipped = 'SKIPPED',
	Unregistered = 'UNREGISTERED',
	Registered = 'REGISTERED',
	Approved = 'APPROVED',
	Booked = 'BOOKED',
}

export class Record {
	courseId: string
	userId: string
	state?: RecordState | BookingStatus

	constructor(courseId: string, userId: string, state?: RecordState) {
		this.courseId = courseId
		this.userId = userId
		this.state = state
	}

	getState() {
		return this.state ? this.state : null
	}

	/**
	 * NOTE: A course record can have state = NULL if it is added to
	 * the learning plan (after being removed) - this is still true even
	 * if it has module records that are in progress.
	 *
	 * A course record with state = NULL will not have it's state field
	 * returned from the learner record API.
	 */
	isNull() {
		return this.state === RecordState.Null
	}

	/**
	 * NOTE: the NotStarted state isn't a state that exists within
	 * the learner record API - but will be used here to indicate that
	 * the record does not exist in any form within the database.
	 */
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
		return this.state === RecordState.Unregistered
	}

	isRegistered() {
		return this.state === RecordState.Registered
	}

	isApproved() {
		return this.state === RecordState.Approved
	}

	setCompleted() {
		this.state = RecordState.Completed
	}

	setInProgress() {
		this.state = RecordState.InProgress
	}
}
