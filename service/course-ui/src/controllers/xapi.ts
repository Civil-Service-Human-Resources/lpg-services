import * as config from 'config'
import {Request, Response} from 'express'
import * as log4js from 'log4js'
import * as request from 'request'

const logger = log4js.getLogger('controllers/xapi')

export let proxy = (req: Request, res: Response) => {
	logger.debug(`Proxying xAPI request to ${req.path}`)

	let agent = {
		objectType: 'Agent',
		mbox: `mailto:${req.user.emailAddress}`,
		name: req.user.id,
	}

	let query = req.query
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
		auth: config.get('xapi.auth'),
		body,
		headers: {
			'Content-Type': req.header('Content-Type'),
			'X-Experience-API-Version': req.header('X-Experience-API-Version'),
		},
		method: req.method,
		qs: query,
		url: `${config.get('xapi.url')}/${req.path.slice(6)}`,
	}).pipe(res)
}
