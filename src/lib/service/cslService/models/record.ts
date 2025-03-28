import {BookingStatus} from './moduleRecord'

export type RecordState = '' |	'COMPLETED' |	'IN_PROGRESS' |	'ARCHIVED' |	'SKIPPED' |	'UNREGISTERED' |	'REGISTERED' |	'APPROVED' |	'BOOKED'

export class Record {
	courseId: string
	userId: string
	state: RecordState | BookingStatus

	constructor(courseId: string, userId: string, state: RecordState) {
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
		return this.state === ''
	}

	/**
	 * NOTE: the NotStarted state isn't a state that exists within
	 * the learner record API - but will be used here to indicate that
	 * the record does not exist in any form within the database.
	 */
	isStarted() {
		return this.state !== ''
	}

	isInProgress() {
		return this.state === 'IN_PROGRESS'
	}

	isCompleted() {
		return this.state === 'COMPLETED'
	}

	isArchived() {
		return this.state === 'ARCHIVED'
	}

	isSkipped() {
		return this.state === 'SKIPPED'
	}

	isUnregistered() {
		return this.state === 'UNREGISTERED'
	}

	isRegistered() {
		return this.state === 'REGISTERED'
	}

	isApproved() {
		return this.state === 'APPROVED'
	}

}
