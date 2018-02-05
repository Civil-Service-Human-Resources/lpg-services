import {Request, Response} from 'express'
import * as config from 'lib/config'
import * as log4js from 'log4js'
import * as request from 'request'

const logger = log4js.getLogger('controllers/xapi')

export function proxy(req: Request, res: Response) {
	logger.debug(`Proxying xAPI request to ${req.path}`)

	const agent = {
		mbox: `mailto:${req.user.emailAddress}`,
		name: req.user.id,
		objectType: 'Agent',
	}

	const query = req.query
	if (query && query.hasOwnProperty('agent')) {
		query.agent = JSON.stringify(agent)
	}

	let body = req.body
	if (body) {
		if (body.hasOwnProperty('actor')) {
			body.actor = agent
		}
		body = JSON.stringify(body)
	}

	request({
		auth: config.XAPI.auth,
		body,
		headers: {
			'Content-Type': req.header('Content-Type'),
			'X-Experience-API-Version': req.header('X-Experience-API-Version'),
		},
		method: req.method,
		qs: query,
		url: `${config.XAPI.url}/${req.path.slice(6)}`,
	}).pipe(res)
}
