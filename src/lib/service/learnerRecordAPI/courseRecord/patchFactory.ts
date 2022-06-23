import * as moment from 'moment'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {RecordState} from '../models/record'

function getNow() {
	return moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
}

export function completeRecord() {
	return [JsonPatch.replacePatch('state', RecordState.Completed), JsonPatch.replacePatch('lastUpdated', getNow())]
}

export function setLastUpdated() {
	return [JsonPatch.replacePatch('lastUpdated', getNow())]
}

export function setInProgress() {
	return [JsonPatch.replacePatch('state', RecordState.InProgress), JsonPatch.replacePatch('lastUpdated', getNow())]
}

export function addCourseToLearningPlan() {
	return [
		JsonPatch.replacePatch('preference', 'LIKED'),
		JsonPatch.removePatch('state'),
		JsonPatch.replacePatch('lastUpdated', getNow()),
	]
}

export function setStateToArchived() {
	return [JsonPatch.replacePatch('state', RecordState.Archived), JsonPatch.replacePatch('lastUpdated', getNow())]
}
