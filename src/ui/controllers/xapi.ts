import axios from 'axios'
import * as express from 'express'
import * as config from 'lib/config'
import * as extended from 'lib/extended'
import * as log4js from 'log4js'
import * as xapi from 'lib/xapi'

const logger = log4js.getLogger('controllers/xapi')

export async function proxy(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	logger.debug(`Proxying xAPI request to ${req.path}`)

	const agent = {
		account: {
			homePage: xapi.HomePage,
			name: req.user.id,
		},
		name: req.user.givenName,
		objectType: 'Agent',
	}

	const query = req.query
	if (query) {
		if (query.hasOwnProperty('agent')) {
			query.agent = JSON.stringify(agent)
		}
		if (query.hasOwnProperty('activityId')) {
			query.activityId = req.course.uri
		}
	}

	const body = req.body
	if (body) {
		if (body.hasOwnProperty('actor')) {
			body.actor = agent
		}
		if (
			body.hasOwnProperty('object') &&
			body.object.objectType === 'Activity'
		) {
			body.object.id = `${config.XAPI.activityBaseUri}/${req.course.uid}`
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
