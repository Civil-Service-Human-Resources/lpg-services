import * as moment from 'moment'
import {JsonPatch, Ops} from '../../shared/models/JsonPatch'

function getNow() {
	return moment(new Date()).format('YYYY-MM-DDTHH:mm:ss')
}

export function completeRecord() {
	return [
		new JsonPatch(Ops.replace, 'state', 'COMPLETED'),
		new JsonPatch(Ops.replace, 'lastUpdated', getNow()),
	]
}
