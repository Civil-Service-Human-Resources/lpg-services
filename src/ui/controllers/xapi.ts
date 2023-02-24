import axios from 'axios'
import * as express from 'express'
import * as config from 'lib/config'
import { getLogger } from 'lib/logger'
import * as xapi from 'lib/xapi'
import * as querystring from 'querystring'

import { User } from '../../lib/model'
import { get } from '../../lib/service/catalog'
import {
	CompletedActionWorker
} from '../../lib/service/learnerRecordAPI/workers/moduleRecordActionWorkers/CompletedActionWorker'
import {
	FailModuleActionWorker
} from '../../lib/service/learnerRecordAPI/workers/moduleRecordActionWorkers/FailModuleActionWorker'
import {
	PassModuleActionWorker
} from '../../lib/service/learnerRecordAPI/workers/moduleRecordActionWorkers/PassModuleActionWorker'

const logger = getLogger('controllers/xapi')

const learnerRecordVerbs = [
	xapi.Verb.Completed,
	xapi.Verb.Failed,
	xapi.Verb.Passed,
]

export async function proxy(req: express.Request, res: express.Response) {
	logger.debug(`Proxying xAPI request to ${req.path}`)

	const user = req.user

	if (user === undefined) {
		logger.error(`User in xAPI request was undefined. CourseID: ${req.params.proxyCourseId}.
						ModuleID: ${req.params.proxyModuleId}. Returning 500 to avoid an exception`)
		logger.debug(JSON.stringify(req.cookies))
		return res.sendStatus(500)
	}

	if (req.query.method) {
		// This indicates a request has been converted to a POST. The request body will contain headers and parameter
		// required for actually completing the request.
		// Not sure why, but someone thought this was a good idea at some point.
		req = await unwrapPost(req)
	}

	let body = req.body
	logger.debug('XAPI request req.body: ' + JSON.stringify(body))

	// If the request is a statement request, sync the verb(s) to learner record and then throw away the request.
	// Learning locker doesn't use the statements.
	// Also, only sync COMPLETED, PASSED and FAILED verbs. IN_PROGRESS status can be set at module launch.
	if (req.path === '/statements') {
		if (body) {
			const xapiBody = Array.isArray(body) ? body : [body]
			await Promise.all(xapiBody.map((b: any) => {
				try {
					if (b.verb && b.verb.id && learnerRecordVerbs.includes(b.verb.id)) {
						return syncToLearnerRecord(req.params.proxyCourseId, req.params.proxyModuleId, req.user, b.verb.id)
					}
				} catch (e) {
					console.error(`Error syncing data to learner record: ${e}. CourseID: ${req.params.proxyCourseId}.
					ModuleID: ${req.params.proxyModuleId}. User: ${user.id}. Verb: ${b.verb.id}`)
				}
			}))
		}
		return res.sendStatus(200)
	}

	const agent = {
		account: {
			homePage: xapi.HomePage,
			name: req.user.id,
		},
		name: req.user.givenName,
		objectType: 'Agent',
	}

	if (body) {
		if (Array.isArray(body)) {
			body = body.map(statement => updateStatement(statement, agent, req))
		} else if (typeof body === 'object') {
			body = updateStatement(body, agent, req)
		} else {
			body = new Buffer(body)
		}
	}

	const query = req.query
	if (query) {
		if (query.agent) {
			query.agent = JSON.stringify(agent)
		}
		if (query.activityId) {
			query.activityId = `${config.XAPI.moduleBaseUri}/${req.params.proxyModuleId}`
		}
	}

	const headers: Record<string, string> = {
		'X-Experience-API-Version':
			req.header('X-Experience-API-Version') || '1.0.3',
	}

	const ctype = req.header('Content-Type')
	if (ctype) {
		headers['Content-Type'] = ctype
	}

	try {
		const response = await axios({
			auth: config.XAPI.auth,
			data: body,
			headers,
			method: req.method,
			params: query,
			responseType: 'stream',
			url: `${config.XAPI.url}${req.path}`,
		})
		response.data.pipe(res)
	} catch (e) {
		logger.warn('Error proxying xapi request', e)
		if (e.response) {
			res.sendStatus(e.response.status)
		} else {
			res.sendStatus(500)
		}
	}
}

async function unwrapPost(req: express.Request) {
	// @ts-ignore
	req.method = req.query.method
	const data = querystring.parse(req.body)

	req.headers = {
		'Content-Type': data['Content-Type'],
		'X-Experience-API-Version': data['X-Experience-API-Version'],
	}

	req.body = data.content ? JSON.parse(data.content as string) : null

	delete data.Authorization
	delete data.content
	delete data['Content-Type']
	delete data['X-Experience-API-Version']

	// @ts-ignore
	req.query = data

	return req
}

function updateStatement(statement: any, agent: any, req: express.Request) {
	if (statement.actor) {
		statement.actor = agent
	}
	if (
		statement.object &&
		statement.object.objectType === 'Activity'
	) {
		statement.object.id = `${config.XAPI.moduleBaseUri}/${req.params.proxyModuleId}`
		if (statement.object.definition) {
			statement.object.definition.type = xapi.Type.ELearning
		}
	}
	if (
		statement.context &&
		statement.context.contextActivities
	) {
		statement.context.contextActivities.parent = [
			{
				id: `${config.XAPI.courseBaseUri}/${req.params.proxyCourseId}`,
			},
		]
	} else {
		statement.context = {
			contextActivities: {
				parent: [
					{
						id: `${config.XAPI.courseBaseUri}/${req.params.proxyCourseId}`,
					},
				],
			},
		}
	}
	return statement
}

async function syncToLearnerRecord(courseId: string, moduleId: string, user: User, verbId: string) {
	const course = await get(courseId, user)
	let actionWorker = null
	if (course) {
		const module = course.getModule(moduleId)
		switch (verbId) {
			case xapi.Verb.Completed:
				actionWorker = new CompletedActionWorker(course, user, module)
				break
			case xapi.Verb.Passed:
				actionWorker = new PassModuleActionWorker(course, user, module)
				break
			case xapi.Verb.Failed:
				actionWorker = new FailModuleActionWorker(course, user, module)
				break
			default:
				break
		}
		if (actionWorker) {
			await actionWorker.applyActionToLearnerRecord()
		}
	}
}
