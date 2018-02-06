import * as axios from 'axios'
import {Request, Response} from 'express'
import * as config from 'lib/config'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/xapi')

export async function proxy(req: Request, res: Response) {
	logger.debug(`Proxying xAPI request to ${req.path}`)

	const agent = {
		mbox: `mailto:${req.user.emailAddress}`,
		name: req.user.id,
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

	let body = req.body
	if (body) {
		if (body.hasOwnProperty('actor')) {
			body.actor = agent
		}
		if (
			body.hasOwnProperty('object') &&
			body.object.objectType === 'Activity'
		) {
			body.object.id = req.course.uri
		}
	}

	let headers = {
		'X-Experience-API-Version': req.header('X-Experience-API-Version'),
	}

	if (req.header('Content-Type')) {
		headers['Content-Type'] = req.header('Content-Type')
	}

	try {
		let response = await axios({
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
