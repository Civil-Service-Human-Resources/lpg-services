import * as moment from 'moment'
import {JsonPatch, Ops} from '../../shared/models/JsonPatch'
import { RecordState } from '../models/record'

function getNow() {
	return moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
}

export function completeRecord() {
	return [
		new JsonPatch(Ops.replace, 'state', RecordState.Completed),
		new JsonPatch(Ops.replace, 'lastUpdated', getNow()),
	]
}

export function setLastUpdated() {
	return [new JsonPatch(Ops.replace, 'lastUpdated', getNow())]
}
