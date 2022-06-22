import { plainToClass } from 'class-transformer'
import * as model from '../../../model'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {makeRequest, patch} from '../baseConfig'
import {ModuleRecord} from './models/moduleRecord'
import {ModuleRecordInput} from './models/moduleRecordInput'
import {completeRecord, initModule, setUpdatedAt} from './patchFactory'

const URL = '/module_records'

export async function completeModuleRecord(moduleRecordId: number, user: model.User) {
	const jsonPatch = completeRecord()
	return await patchModuleRecord(jsonPatch, user, moduleRecordId)
}

export async function initialiseModuleRecord(moduleRecordId: number, user: model.User) {
	const jsonPatch = initModule()
	return await patchModuleRecord(jsonPatch, user, moduleRecordId)
}

export async function updateModuleRecordUpdatedAt(moduleRecordId: number, user: model.User) {
	const jsonPatch = setUpdatedAt()
	return await patchModuleRecord(jsonPatch, user, moduleRecordId)
}

async function patchModuleRecord(jsonPatch: JsonPatch[], user: model.User, moduleRecordId: number) {
	const res =  await patch<ModuleRecord>(
		{
			data: jsonPatch,
			url: `${URL}/${moduleRecordId}`,
		},
		user
	)
	return plainToClass(ModuleRecord, res)
}

export async function createModuleRecord(moduleRecord: ModuleRecordInput, user: model.User) {
	const res = await makeRequest<ModuleRecord>(
		{
			data: moduleRecord,
			method: 'POST',
			url: URL,
		},
		user
	)
	return plainToClass(ModuleRecord, res)
}
