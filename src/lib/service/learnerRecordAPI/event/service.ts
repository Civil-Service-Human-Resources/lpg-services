import {User} from 'src/lib/model'
import {CourseRecord} from '../courseRecord/models/courseRecord'
import {RecordState} from '../models/record'
import {BookingStatus, ModuleRecord} from '../moduleRecord/models/moduleRecord'
import {getEventsByUids} from './client'
import {Event} from './models/event'

export async function getCancelledEventUidsFromCourseRecord(courseRecords: CourseRecord | CourseRecord[], user: User) {
	let records: CourseRecord[]
	if (Array.isArray(courseRecords)) {
		records = courseRecords
	} else {
		records = [courseRecords]
	}

	const eventIds = getEventUidsFromCourseRecords(records)
	const learnerRecordEvents: Event[] = await getEventsByUids(eventIds, user)
	const cancelledEvents = learnerRecordEvents.filter(event => event.status === 'Cancelled')
	const cancelledEventUids = cancelledEvents.map(event => event.uid)

	return cancelledEventUids
}

export async function updateStatusForCancelledEventsInCourseRecord(
	courseRecord: CourseRecord,
	cancelledEventUids: string[],
	statusForCancelledEvents: RecordState | BookingStatus
) {
	courseRecord?.modules.forEach(moduleRecord => {
		if (moduleRecord.eventId && cancelledEventUids.includes(moduleRecord.eventId)) {
			moduleRecord.state = statusForCancelledEvents
		}
	})
	return courseRecord
}

export function getEventUidsFromCourseRecords(courseRecords: CourseRecord[]) {
	const eventIds: string[] = courseRecords
		.map(courseRecord => courseRecord.modules)
		.flat()
		.filter((moduleRecord): moduleRecord is ModuleRecord & {eventId: string} => moduleRecord.eventId !== undefined)
		.map(moduleRecord => moduleRecord.eventId)
	return eventIds
}
