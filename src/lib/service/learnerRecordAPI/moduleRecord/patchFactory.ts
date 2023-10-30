import * as moment from 'moment'

import {JsonPatch} from '../../shared/models/JsonPatch'
import {RecordState} from '../models/record'
import {BookingStatus, ModuleRecordResult} from './models/moduleRecord'

export function clearBookingStatus() {
	return JsonPatch.removePatch('bookingStatus')
}

export function clearResult() {
	return JsonPatch.removePatch('result')
}

export function clearScore() {
	return JsonPatch.removePatch('score')
}

export function clearCompletionDate() {
	return JsonPatch.removePatch('completionDate')
}

export function setResult(result?: ModuleRecordResult) {
	return JsonPatch.replacePatch('result', result)
}

export function setEventId(eventId: string) {
	return JsonPatch.replacePatch('eventId', eventId)
}

export function setEventDate(eventDate: Date) {
	return setDate('eventDate', eventDate)
}

function setDate(key: string, date: Date) {
	const convertedDate = moment(date).format('YYYY-MM-DDTHH:mm:ss')
	return JsonPatch.replacePatch(key, convertedDate)
}

export function setBookingStatus(status: BookingStatus) {
	return JsonPatch.replacePatch('bookingStatus', status.toString())
}

export function setCompletionDate(completionDate: Date) {
	return setDate('completionDate', completionDate)
}

export function setState(state: RecordState) {
	return JsonPatch.replacePatch('state', state)
}
