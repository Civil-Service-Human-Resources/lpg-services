import * as moment from 'moment'
import {JsonPatch, Ops} from '../../shared/models/JsonPatch'
import {RecordState} from '../models/record'

function getNow() {
	return moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
}

export function completeRecord() {
	return [
		new JsonPatch(Ops.replace, 'state', RecordState.Completed),
		new JsonPatch(Ops.replace, 'updatedAt', getNow()),
		new JsonPatch(Ops.replace, 'completionDate', getNow()),
	]
}

export function initModule() {
	return [
		new JsonPatch(Ops.replace, 'state', RecordState.InProgress),
		new JsonPatch(Ops.replace, 'result', undefined),
		new JsonPatch(Ops.replace, 'score', undefined),
		new JsonPatch(Ops.replace, 'completionDate', undefined),
		new JsonPatch(Ops.replace, 'updatedAt', getNow()),
	]
}

export function setUpdatedAt() {
	return [new JsonPatch(Ops.replace, 'updatedAt', getNow())]
}

export function passElearningModule() {
	return [
		new JsonPatch(Ops.replace, 'state', RecordState.Completed),
		new JsonPatch(Ops.replace, 'result', 'PASSED'),
		new JsonPatch(Ops.replace, 'updatedAt', getNow()),
		new JsonPatch(Ops.replace, 'completionDate', getNow()),
	]
}

export function rateModule() {
	return [
		new JsonPatch(Ops.replace, 'rated', 'true'),
		new JsonPatch(Ops.replace, 'updatedAt', getNow()),
	]
}

export function registerForEventModule() {
	return [
		new JsonPatch(Ops.replace, 'state', RecordState.Registered),
		new JsonPatch(Ops.replace, 'result', undefined),
		new JsonPatch(Ops.replace, 'score', undefined),
		new JsonPatch(Ops.replace, 'completionDate', undefined),
		new JsonPatch(Ops.replace, 'updatedAt', getNow()),
	]
}
