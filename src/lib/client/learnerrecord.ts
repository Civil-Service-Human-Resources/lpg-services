import axios from 'axios'
import * as https from "https"
import * as axiosLogger from 'lib/axiosLogger'
import {getLogger} from 'lib/logger'
import { ModuleRecord } from 'lib/model/learnerRecord/moduleRecord'
import {getPurchaseOrder} from "lib/service/skills"
import * as query from 'querystring'
import * as config from '../config'
import * as model from '../model'
import { CourseRecord } from '../model/learnerRecord/courseRecord'
import * as catalog from '../service/catalog'

const logger = getLogger('learner-record')

const http = axios.create({
	baseURL: config.LEARNER_RECORD.url,
	headers: {
		'Content-Type': 'application/json',
	},
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

export async function cancelBooking(event: any, cancellationReason: any, user: any): Promise<any> {
	const data: any = {
		cancellationReason,
		status: 'Cancelled',
	}
	try {
		return await http.patch(`/event/${event.id}/learner/${user.id}/`, data, {
			headers: {
				Authorization: `Bearer ${user.accessToken}`,
			},
			validateStatus: status => {
				return status === 200 || status === 400 || status === 404
			},
		})
	} catch (e) {
		logger.error(e)
	}
}

export async function bookEvent(
	course: any,
	module: any,
	event: any,
	user: any,
	poNumber: string,
	accessibilityOptions: any): Promise<any> {
	const data: any = {
		accessibilityOptions,
		event: `${config.COURSE_CATALOGUE.url}/courses/${course.id}/modules/${module.id}/events/${event.id}`,
		learner: user.id,
		learnerEmail: user.userName,
	}

	const purchaseOrder = await getPurchaseOrder(poNumber)
	if (purchaseOrder) {
		data.paymentDetails = `${config.REGISTRY_SERVICE_URL}/purchaseOrders/${poNumber}`
		data.status = 'Confirmed'
	} else if (module.cost === 0) {
		data.status = 'Confirmed'
	} else {
		data.status = 'Requested'
		data.poNumber = poNumber
	}
	try {
		return await http.post(`/event/${event.id}/booking/`, data, {
			headers: {
				Authorization: `Bearer ${user.accessToken}`,
			},
			validateStatus: status => {
				return status === 201 || status === 400
			},
		})
	} catch (e) {
		logger.error(e)
	}
}

export async function getActiveBooking(eventId: string, user: any): Promise<any> {
	return await http.get(`/event/${eventId}/booking/${user.id}/active`, {
		headers: {
			Authorization: `Bearer ${user.accessToken}`,
		},
		validateStatus: status => {
			return status === 200 || status === 404
		},
	})
}

export async function getCancellationReasons(user: any): Promise<any> {
	return await http.get(`/event/booking/userCancellationReasons`, {
		headers: {
			Authorization: `Bearer ${user.accessToken}`,
		},
	})
}

export async function getCourseRecord(courseId: String, user: model.User) {
	let response = await http.get('/course_records',
		{
			headers: {Authorization: `Bearer ${user.accessToken}`},
			params: {
				courseId: courseId,
				userId: user.id
			}
		}
	)
	let course_records = response.data.course_records
	if (course_records.length == 1) {
		let record = course_records[0]
		return convert(record)
	} else {
		return null
	}
}

export async function getRecord(
	user: model.User,
	course: model.Course,
	module?: model.Module,
	event?: model.Event
) {
	let activityId = course.getActivityId()
	if (event) {
		activityId = event.getActivityId()
	} else if (module && !event) {
		activityId = module.getActivityId()
	}

	const response = await http.get(`/records/${user.id}`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
		params: {
			activityId,
		},
	})
	if (response.data.records.length > 0) {
		const record = response.data.records[0]
		return convert(record)
	}
	return null
}

export async function getLearningRecord(
	user: model.User, activityIds?: string[], includeStates?: string[], ignoreStates?: string[])
	: Promise<model.Course[]> {
	const records = await getRawLearningRecord(user, activityIds, includeStates, ignoreStates)
	const courseIds = records.map(record => record.courseId)
	const courses = await catalog.list(courseIds, user)

	for (const course of courses) {
		course.record = records.find(r => r.courseId === course.id)
	}
	return courses
}

export async function getRawLearningRecord(
	user: model.User, activityIds?: string[], includeStates?: string[], ignoreStates?: string[]): Promise<CourseRecord[]> {
	const params = {
		activityId: activityIds,
		ignoreState: ignoreStates,
		includeState: includeStates,
	}
	const response = await http.get(`/records/${user.id}?${query.stringify(params)}`, {
		headers: {Authorization: `Bearer ${user.accessToken}`},
	})
	return response.data.records.map(convert)
}

function convert(record: CourseRecord) {
	return new CourseRecord(record)
}

export interface EventRegistrations {
	[eventId: string]: number
}

export async function getRegistrationsForEvents(
	events: string[],
	user: model.User
): Promise<EventRegistrations> {
	const queryParam = events.join('&eventId=')
	const response = await http.get(
		`/registrations/count?eventId=${queryParam}`,
		{headers: {Authorization: `Bearer ${user.accessToken}`}}
	)

	const registrations: EventRegistrations = {}

	response.data.map((registration: {eventId: string; value: number}) => {
		registrations[registration.eventId] = registration.value
	})

	return registrations
}

export async function countReadyForFeedback(learningRecord: CourseRecord[]) {
	let count = 0
	for (const courseRecord of learningRecord) {
		for (const moduleRecord of courseRecord.modules) {
			if (!moduleRecord.rated && moduleRecord.isCompleted()) {
				count++
			}
		}
	}
	return count
}

export async function getReadyForFeedback(learningRecord: model.Course[]) {
	const readyForFeedback = []
	for (const course of learningRecord) {
		for (const moduleRecord of course.record!.modules) {
			if (!moduleRecord.rated && moduleRecord.isCompleted()) {
				const module = course.modules.find(m => m.id === moduleRecord.moduleId)
				if (!module) {
					logger.debug(
						`No module found matching user's module record, id = ${
							moduleRecord.moduleId
						}`
					)
				} else {
					readyForFeedback.push({
						completionDate: moduleRecord.completionDate,
						course,
						module,
					})
				}
			}
		}
	}
	return readyForFeedback.sort(
		(a, b) => b.completionDate!.getTime() - a.completionDate!.getTime()
	)
}

export function isActive(record: CourseRecord) {
	return (
		!record.isArchived() &&
		!record.isSkipped() &&
		record.preference !== 'DISLIKED'
	)
}

export function createModuleRecord(newModuleRecord: ModuleRecord) {
    throw new Error("Function not implemented.")
}

export function createCourseRecord(newCourseRecord: CourseRecord) {
    throw new Error("Function not implemented.")
}

export function patchCourseRecord(courseRecordData: CourseRecord) {

}