import axios from 'axios'
import * as express from 'express'
import * as config from './config'

export interface Statement {
	actor: {
		mbox: string
		name: string
		objectType: 'Agent'
	}
	object: {
		id: string
		objectType: 'Activity' | 'StatementRef'
	}
	result?: any
	timestamp?: any
	verb: {
		display: {
			en: string
		}
		id: string
	}
}

export const Verb = {
	Completed: 'http://adlnet.gov/expapi/verbs/completed',
	Failed: 'http://adlnet.gov/expapi/verbs/failed',
	Initialised: 'http://adlnet.gov/expapi/verbs/initialized',
	Passed: 'http://adlnet.gov/expapi/verbs/passed',
	PlayedVideo: 'https://w3id.org/xapi/video/verbs/played',
	Progressed: 'http://adlnet.gov/expapi/verbs/progressed',
	Terminated: 'http://adlnet.gov/expapi/verbs/terminated',
	Viewed: 'http://id.tincanapi.com/verb/viewed',
}

export const Labels: Record<string, string> = {
	[Verb.Completed]: 'completed',
	[Verb.Failed]: 'failed',
	[Verb.Initialised]: 'initialised',
	[Verb.Passed]: 'passed',
	[Verb.PlayedVideo]: 'played video',
	[Verb.Progressed]: 'progressed',
	[Verb.Terminated]: 'terminated',
	[Verb.Viewed]: 'viewed',
}

for (const verb of Object.values(Verb)) {
	if (!Labels[verb]) {
		throw new Error(`Missing label for the xAPI verb: ${verb}`)
	}
}

export function lookup(verb: string) {
	const verbs = Verb as Record<string, string | undefined>
	return verbs[verb]
}

export async function record(
	req: express.Request,
	courseID: string,
	verb: string,
	valueJSON = ''
) {
	if (!Labels[verb]) {
		throw new Error(`Unknown xAPI verb: ${verb}`)
	}
	const payload: Statement = {
		actor: {
			mbox: `mailto:${req.user.emailAddress}`,
			name: req.user.id,
			objectType: 'Agent',
		},
		object: {
			id: `${config.XAPI.activityBaseUri}/${courseID}`,
			objectType: 'Activity',
		},
		verb: {
			display: {
				en: Labels[verb],
			},
			id: verb,
		},
	}
	if (verb === Verb.Progressed) {
		if (!valueJSON) {
			throw new Error('Missing value for the xAPI Progressed statement')
		}
		const value = JSON.parse(valueJSON)
		if (
			typeof value !== 'number' ||
			Math.floor(value) !== value ||
			value > 100 ||
			value < 0
		) {
			throw new Error(
				`Invalid value for the xAPI Progressed statement: "${valueJSON}"`
			)
		}
		payload.result = {
			extensions: {
				'https://w3id.org/xapi/cmi5/result/extensions/progress': value,
			},
		}
	}
	await send(payload)
}

export async function search() {}

export async function send(statement: Statement) {
	try {
		const resp = await axios.post(
			`${config.XAPI.url}/statements`,
			JSON.stringify([statement]),
			{
				auth: config.XAPI.auth,
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'X-Experience-API-Version': '1.0.3',
				},
			}
		)
		if (resp.status !== 200) {
			throw new Error(
				`Got unexpected response status ${
					resp.status
				} when posting xAPI statement`
			)
		}
	} catch (err) {
		throw new Error(`Couldn't post to xAPI: ${err}`)
	}
	return
}

export async function voidify(req: express.Request, id: string) {
	const payload: Statement = {
		actor: {
			mbox: `mailto:${req.user.emailAddress}`,
			name: req.user.id,
			objectType: 'Agent',
		},
		object: {
			id,
			objectType: 'StatementRef',
		},
		verb: {
			display: {
				en: 'voided',
			},
			id: 'http://adlnet.gov/expapi/verbs/voided',
		},
	}
	await send(payload)
}
