import * as moment from 'moment'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {RecordState} from '../models/record'

function getNow() {
	return moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
}

export function completeRecord() {
	return [
		JsonPatch.replacePatch('state', RecordState.Completed),
		JsonPatch.replacePatch('updatedAt', getNow()),
		JsonPatch.replacePatch('completionDate', getNow()),
	]
}

export function initModule() {
	return [
		JsonPatch.replacePatch('state', RecordState.InProgress),
		JsonPatch.replacePatch('result', undefined),
		JsonPatch.replacePatch('score', undefined),
		JsonPatch.replacePatch('completionDate', undefined),
		JsonPatch.replacePatch('updatedAt', getNow()),
	]
}

export function setUpdatedAt() {
	return [JsonPatch.replacePatch('updatedAt', getNow())]
}

export function passElearningModule() {
	return [
		JsonPatch.replacePatch('state', RecordState.Completed),
		JsonPatch.replacePatch('result', 'PASSED'),
		JsonPatch.replacePatch('updatedAt', getNow()),
		JsonPatch.replacePatch('completionDate', getNow()),
	]
}

export function rateModule() {
	return [
		JsonPatch.replacePatch('rated', 'true'),
		JsonPatch.replacePatch('updatedAt', getNow()),
	]
}

export function registerForEventModule() {
	return [
		JsonPatch.replacePatch('state', RecordState.Registered),
		JsonPatch.replacePatch('result', undefined),
		JsonPatch.replacePatch('score', undefined),
		JsonPatch.replacePatch('completionDate', undefined),
		JsonPatch.replacePatch('updatedAt', getNow()),
	]
}
