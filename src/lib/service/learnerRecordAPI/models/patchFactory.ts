import * as moment from 'moment'
import {JsonPatch, Ops} from '../../shared/models/JsonPatch'
import {RecordState} from './record'

export function completeRecord() {
	return [new JsonPatch(Ops.replace, 'state', 'COMPLETED')]
}

export function initModule() {
	return [
		new JsonPatch(Ops.replace, 'state', RecordState.InProgress),
		new JsonPatch(Ops.replace, 'result', undefined),
		new JsonPatch(Ops.replace, 'score', undefined),
		new JsonPatch(Ops.replace, 'completionDate', undefined),
	]
}

export function setUpdatedAt() {
	return [new JsonPatch(Ops.replace, 'updatedAt', moment(new Date()).format('YYYY-MM-DDTHH:mm:ss'))]
}

export function passElearningModule() {
	return [new JsonPatch(Ops.replace, 'state', RecordState.Completed), new JsonPatch(Ops.replace, 'result', 'PASSED')]
}

export function rateModule() {
	return [new JsonPatch(Ops.replace, 'rated', 'true')]
}

export function registerForEventModule() {
	return [
		new JsonPatch(Ops.replace, 'state', RecordState.Registered),
		new JsonPatch(Ops.replace, 'result', undefined),
		new JsonPatch(Ops.replace, 'score', undefined),
		new JsonPatch(Ops.replace, 'completionDate', undefined),
	]
}
