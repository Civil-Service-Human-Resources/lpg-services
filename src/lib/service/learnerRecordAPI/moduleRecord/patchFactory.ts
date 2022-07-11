import * as moment from 'moment'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {RecordState} from '../models/record'
import { ModuleRecordResult } from './models/moduleRecord';

export function setScore(score?: string) {
	return JsonPatch.replacePatch('score', score)
}

export function setRated(rated: boolean) {
	return JsonPatch.replacePatch('rated', rated.toString())
}

export function setResult(result?: ModuleRecordResult) {
	return JsonPatch.replacePatch('result', result)
}

function setDate(key: string, date?: Date) {
	let convertedDate = undefined
	if (date) {
		convertedDate = moment(date).format('YYYY-MM-DDTHH:mm:ss')
	}
	return JsonPatch.replacePatch(key, convertedDate)
}

export function setUpdatedAt(updatedAt?: Date) {
	return setDate('updatedAt', updatedAt)
}

export function setCompletionDate(completionDate?: Date) {
	return setDate('completionDate', completionDate)
}

export function setState(state: RecordState) {
	return JsonPatch.replacePatch('state', state)
}