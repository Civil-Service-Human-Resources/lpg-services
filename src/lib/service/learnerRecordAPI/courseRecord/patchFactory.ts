import * as moment from 'moment'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {RecordState} from '../models/record'
import { CourseRecordPreference } from './models/courseRecord';

export function clearState() {
	return JsonPatch.removePatch('state')
}

export function setState(state: RecordState) {
	return JsonPatch.replacePatch('state', state)
}

export function setLastUpdated(lastUpdated: Date = new Date()) {
	return JsonPatch.replacePatch('lastUpdated', moment(lastUpdated).format('YYYY-MM-DDTHH:mm:ss'))
}

export function setPreference(preference: CourseRecordPreference) {
	return JsonPatch.replacePatch('preference', preference)
}