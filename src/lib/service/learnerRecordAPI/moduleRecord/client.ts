import { plainToClass } from 'class-transformer'
import * as model from '../../../model'
import {JsonPatch} from '../../shared/models/JsonPatch'
import {makeRequest, patch} from '../baseConfig'
import {ModuleRecord} from './models/moduleRecord'
import {ModuleRecordInput} from './models/moduleRecordInput'

const URL = '/module_records'

export async function patchModuleRecord(jsonPatch: JsonPatch[], user: model.User, moduleRecordId: number) {
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
