import * as config from 'lib/config'
import { plainToInstance } from '../../../../node_modules/class-transformer'
import { Course, Module, User } from '../../model'
import { HttpClient } from '../httpClient'
import { LaunchModuleRequest } from './models/launchModuleRequest'
import { LaunchModuleResponse } from './models/launchModuleResponse'

const client = HttpClient.createFromParams(config.CSL_SERVICE.url, config.REQUEST_TIMEOUT)

export async function launchELearningModule(
	course: Course,
	module: Module,
	user: User
): Promise<LaunchModuleResponse> {
	const body: LaunchModuleRequest = {
		courseRecordInput: {
			courseTitle: course.title,
			isRequired: course.isRequired(),
			moduleRecords: [
				{
					moduleTitle: module.title,
					moduleType: module.type,
					optional: module.optional,
				},
			],
		},
		learnerFirstName: user.givenName || '',
		learnerLastName: '',
		redirectOnExitUrl: `${config.LPG_UI_SERVER}/learning-record/${course.id}/${module.id}`,
	}
	const resp = await client._post<LaunchModuleRequest, LaunchModuleResponse>(
		{
			url: `/courses/${course.id}/modules/${module.id}/launch`,
		},
		body,
		user
	)
	return plainToInstance(LaunchModuleResponse, resp)
}
