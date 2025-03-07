import {User} from 'src/lib/model'
import {CourseRecord} from '../courseRecord/models/courseRecord'
import {getEventsByUids} from './client'
import {Event} from './models/event'
import {RecordState} from '../models/record'
import {BookingStatus} from '../moduleRecord/models/moduleRecord'

export async function updateStatusForCancelledEventsInCourseRecord(
	courseRecord: CourseRecord,
	user: User,
	statusForCancelledEvents: RecordState | BookingStatus
) {
	const eventIds = getEventIdsFromCourseRecord(courseRecord)

	if (eventIds.length === 0) {
		return courseRecord
	}

	const events: Event[] = await getEventsFromUids(eventIds, user)
	setStatusForCancelledEvents(courseRecord, events, statusForCancelledEvents)

	return courseRecord
}

export function getEventIdsFromCourseRecord(courseRecord: CourseRecord) {
	const eventIds: string[] = []
	courseRecord.modules.forEach(moduleRecord => {
		if (moduleRecord.eventId !== undefined) {
			eventIds.push(moduleRecord.eventId)
		}
	})
	return eventIds
}

export async function getEventsFromUids(eventUids: string[], user: User): Promise<Event[]> {
	const events: Event[] = await getEventsByUids(eventUids, user)
	return events
}

export function setStatusForCancelledEvents(
	courseRecord: CourseRecord,
	events: Event[],
	statusForCancelledEvents: RecordState | BookingStatus
) {
	courseRecord?.modules.forEach(moduleRecord => {
		if (moduleRecord.eventId && events.find(event => event.uid === moduleRecord.eventId)?.status === 'Cancelled') {
			moduleRecord.state = statusForCancelledEvents
		}
	})
}
