import {plainToInstance} from 'class-transformer'
import * as config from 'lib/config'
import {Course, Module, User} from 'lib/model'
import {HttpClient} from '../httpClient'
import {LaunchModuleRequest} from './models/launchModuleRequest'
import {LaunchModuleResponse} from './models/launchModuleResponse'

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
					duration: module.duration,
					moduleTitle: module.title,
					moduleType: module.type,
					optional: module.optional,
				},
			],
		},
		learnerFirstName: user.givenName || '',
		learnerLastName: '',
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

export async function removeCourseFromLearningPlan(courseId: string, user: User): Promise<void> {
	await client._post({
		url: `/courses/${courseId}/remove_from_learning_plan`,
	},
		undefined,
		user)
}

export async function addCourseToLearningPlan(courseId: string, user: User) {
	await client._post({
			url: `/courses/${courseId}/add_course_to_learning_plan`,
		},
		undefined,
		user)
}

export async function removeCourseFromSuggestions(courseId: string, user: User) {
	await client._post({
			url: `/courses/${courseId}/remove_from_suggestions`,
		},
		undefined,
		user)
}
