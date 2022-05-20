import {makeRequest, patch} from '../baseConfig'
import {ModuleRecord} from './models/moduleRecord'
import {ModuleRecordInput} from './models/moduleRecordInput'
import * as model from '../../../model'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {completeRecord, initModule} from '../models/patchFactory'

const URL = '/module_records'

export async function completeModuleRecord(moduleRecordId: number, user: model.User) {
	const jsonPatch = completeRecord()
	return await patchModuleRecord(jsonPatch, user, moduleRecordId)
}

export async function initialiseModuleRecord(moduleRecordId: number, user: model.User) {
	const jsonPatch = initModule()
	return await patchModuleRecord(jsonPatch, user, moduleRecordId)
}

async function patchModuleRecord(jsonPatch: JsonPatch[], user: model.User, moduleRecordId: number) {
	let response = await patch<ModuleRecord>(
		{
			url: `${URL}/${moduleRecordId}`,
			data: jsonPatch,
		},
		user
	)
	return response.data
}

export async function createModuleRecord(moduleRecord: ModuleRecordInput, user: model.User) {
	let response = await makeRequest<ModuleRecord>(
		{
			method: 'POST',
			url: URL,
			data: moduleRecord,
		},
		user
	)
	return response.data
}
