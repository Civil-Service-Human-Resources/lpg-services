import axios from 'axios'
import * as express from 'express'
import * as config from './config'

export const VERBS: Record<string, [string, string]> = {
	Viewed: ['viewed', 'http://id.tincanapi.com/verb/viewed'],
}

export async function post(
	req: express.Request,
	courseID: string,
	verb: [string, string],
	value?: any
) {
	const payload = {
		actor: {
			mbox: `mailto:${req.user.emailAddress}`,
			name: req.user.id,
			objectType: 'Agent',
		},
		object: {
			id: courseID,
			objectType: 'Activity',
		},
		verb: {
			display: {
				en: verb[0],
			},
			id: verb[1],
		},
	}
	try {
		const resp = await axios.post(
			`${config.XAPI.url}/statements`,
			JSON.stringify([payload]),
			{
				auth: config.XAPI.auth,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'X-Experience-API-Version': '1.0.3',
				},
			}
		)
	} catch (err) {
		console.log('Error posting to xAPI:', err)
	}
	return
}
