import {JsonPatch} from '../../shared/models/JsonPatch'
import {RecordState} from '../models/record'

export function setState(state: RecordState) {
	return JsonPatch.replacePatch('state', state)
}
