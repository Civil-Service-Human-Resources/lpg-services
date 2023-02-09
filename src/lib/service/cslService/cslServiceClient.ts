import * as config from 'lib/config'
import {User} from '../../model'
import {HttpClient} from '../httpClient'
import {LaunchModuleResponse} from './models/LaunchModuleResponse'
import {LaunchModuleRequest} from './models/launchModuleRequest'
import {plainToInstance} from '../../../../node_modules/class-transformer'

const client = HttpClient.createFromParams(config.CSL_SERVICE.url, config.REQUEST_TIMEOUT)

export async function launchELearningModule(
	courseId: string,
	moduleId: string,
	user: User
): Promise<LaunchModuleResponse> {
	const body: LaunchModuleRequest = {
		userId: user.id,
		redirectOnExitUrl: `${config.LPG_UI_SERVER}/learning-record/${courseId}/${moduleId}`,
	}
	const resp = await client._post<LaunchModuleRequest, LaunchModuleResponse>(
		{
			url: `/courses/${courseId}/modules/${moduleId}/launch`,
		},
		body,
		user
	)
	return plainToInstance(LaunchModuleResponse, resp)
}
