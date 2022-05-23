import * as model from '../../../model'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {makeRequest, patch} from '../baseConfig'
import {completeRecord, initModule} from '../models/patchFactory'
import {ModuleRecord} from './models/moduleRecord'
import {ModuleRecordInput} from './models/moduleRecordInput'

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
	const response = await patch<ModuleRecord>(
		{
			data: jsonPatch,
			url: `${URL}/${moduleRecordId}`,
		},
		user
	)
	return response.data
}

export async function createModuleRecord(moduleRecord: ModuleRecordInput, user: model.User) {
	const response = await makeRequest<ModuleRecord>(
		{
			data: moduleRecord,
			method: 'POST',
			url: URL,
		},
		user
	)
	return response.data
}
