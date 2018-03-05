import {AxiosResponse, default as axios} from 'axios'
import * as express from 'express'
import * as config from 'lib/config'
import * as model from 'lib/model'

export enum Placement {
	Context,
	Result,
}

export interface Statement {
	actor: {
		account: {
			homePage: 'https://cslearning.gov.uk/'
			name: string
		}
		name: string
		objectType: 'Agent'
	}
	context?: {
		contextActivities: {
			category?: Array<{id: string}>
			parent?: Array<{id: string}>
		}
		extensions?: Record<string, any>
	}
	object: {
		definition?: {
			name: {
				en: string
			}
			type: Type
		}
		id: string
		objectType: 'Activity' | 'StatementRef'
	}
	result?: {
		extensions?: Record<string, any>
	}
	timestamp?: any
	verb: {
		display: {
			en: string
		}
		id: string
	}
}

export enum Type {
	Course = 'http://cslearning.gov.uk/activities/course',
	Event = 'http://adlnet.gov/expapi/activities/event',
	ELearning = 'http://cslearning.gov.uk/activities/elearning',
	FaceToFace = 'http://cslearning.gov.uk/activities/face-to-face',
	Link = 'http://adlnet.gov/expapi/activities/link',
	Video = 'https://w3id.org/xapi/acrossx/activities/video',
}

export const Category = {
	Video: 'https://w3id.org/xapi/video',
}

export const Extension = {
	FinancialApprover: 'http://cslearning.gov.uk/extension/finanacialApprover',
	PurchaseOrder: 'http://cslearning.gov.uk/extension/purhaseOrder',
	VideoLength: 'https://w3id.org/xapi/video/extensions/length',
	VideoTime: 'https://w3id.org/xapi/video/extensions/time',
	VideoTimeFrom: 'https://w3id.org/xapi/video/extensions/time-from',
	VideoTimeTo: 'https://w3id.org/xapi/video/extensions/time-to',
}

export const ExtensionPlacement = {
	[Extension.FinancialApprover]: Placement.Result,
	[Extension.PurchaseOrder]: Placement.Result,
	[Extension.VideoLength]: Placement.Context,
}

export const HomePage = 'https://cslearning.gov.uk/'

export const Verb = {
	Completed: 'http://adlnet.gov/expapi/verbs/completed',
	Disliked: 'https://w3id.org/xapi/acrossx/verbs/disliked',
	Experienced: 'http://adlnet.gov/expapi/verbs/experienced',
	Failed: 'http://adlnet.gov/expapi/verbs/failed',
	Initialised: 'http://adlnet.gov/expapi/verbs/initialized',
	Liked: 'https://w3id.org/xapi/acrossx/verbs/liked',
	Passed: 'http://adlnet.gov/expapi/verbs/passed',
	PausedVideo: 'https://w3id.org/xapi/video/verbs/paused',
	PlayedVideo: 'https://w3id.org/xapi/video/verbs/played',
	Progressed: 'http://adlnet.gov/expapi/verbs/progressed',
	Registered: 'http://adlnet.gov/expapi/verbs/registered',
	Seeked: 'https://w3id.org/xapi/video/verbs/seeked',
	Terminated: 'http://adlnet.gov/expapi/verbs/terminated',
	Unregistered: 'http://adlnet.gov/expapi/verbs/unregistered',
	Viewed: 'http://id.tincanapi.com/verb/viewed',
	Voided: 'http://adlnet.gov/expapi/verbs/voided',
}

export const Labels: Record<string, string> = {
	[Verb.Completed]: 'completed',
	[Verb.Disliked]: 'disliked',
	[Verb.Experienced]: 'experienced',
	[Verb.Failed]: 'failed',
	[Verb.Initialised]: 'initialised',
	[Verb.Liked]: 'liked',
	[Verb.Passed]: 'passed',
	[Verb.PausedVideo]: 'paused video',
	[Verb.PlayedVideo]: 'played video',
	[Verb.Progressed]: 'progressed',
	[Verb.Registered]: 'registered',
	[Verb.Seeked]: 'seeked',
	[Verb.Terminated]: 'terminated',
	[Verb.Unregistered]: 'unregistered',
	[Verb.Viewed]: 'viewed',
	[Verb.Voided]: 'voided',
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
	course: model.Course,
	verb: string,
	extensions?: Record<string, any>,
	module?: model.Module,
	event?: model.Event
) {
	if (!Labels[verb]) {
		throw new Error(`Unknown xAPI verb: ${verb}`)
	}
	let type: Type
	switch (module ? module.type : course.getType()) {
		case 'blended':
			type = Type.Course
			break
		case 'elearning':
			type = Type.ELearning
			break
		case 'face-to-face':
			type = Type.FaceToFace
			if (event) {
				type = Type.Event
			}
			break
		case 'link':
			type = Type.Link
			break
		case 'video':
			type = Type.Video
			break
		default:
			throw new Error(`Unknown course type ${course.getType()}`)
	}
	const payload: Statement = {
		actor: {
			account: {
				homePage: HomePage,
				name: req.user.id,
			},
			name: req.user.givenName,
			objectType: 'Agent',
		},
		object: {
			definition: {
				name: {
					en: course.title,
				},
				type,
			},
			id: course.getActivityId(),
			objectType: 'Activity',
		},
		verb: {
			display: {
				en: Labels[verb],
			},
			id: verb,
		},
	}
	if (module) {
		payload.context = {
			contextActivities: {
				parent: [
					{
						id: course.getActivityId(),
					},
				],
			},
		}
		if (module.title) {
			payload.object.definition!.name.en = module.title
		}
		if (event) {
			payload.object.id = event.getActivityId()
			payload.context!.contextActivities.parent!.push({
				id: module!.getActivityId(),
			})
		} else {
			payload.object.id = module!.getActivityId()
		}
	}
	if (extensions) {
		for (const extension of Object.keys(extensions)) {
			const placement = ExtensionPlacement[extension]
			if (placement === undefined) {
				throw new Error(
					`Could not find placement location for the extension: ${extension}`
				)
			}
			switch (placement) {
				case Placement.Context:
					if (!payload.context!.extensions) {
						payload.context!.extensions = {}
					}
					payload.context!.extensions![extension] = extensions[extension]
					break
				case Placement.Result:
					if (!payload.result) {
						payload.result = {
							extensions: {},
						}
					}
					payload.result.extensions![extension] = extensions[extension]
					break
			}
		}
		// payload.object.definition!.extensions = extensions
	}
	switch (course.getType()) {
		case 'video':
			payload.context!.contextActivities.category = [
				{
					id: Category.Video,
				},
			]
			break
	}
	// if (verb === Verb.Progressed) {
	// 	if (!valueJSON) {
	// 		throw new Error('Missing value for the xAPI Progressed statement')
	// 	}
	// 	const value = JSON.parse(valueJSON)
	// 	if (
	// 		typeof value !== 'number' ||
	// 		Math.floor(value) !== value ||
	// 		value > 100 ||
	// 		value < 0
	// 	) {
	// 		throw new Error(
	// 			`Invalid value for the xAPI Progressed statement: "${valueJSON}"`
	// 		)
	// 	}
	// 	payload.result = {
	// 		extensions: {
	// 			'https://w3id.org/xapi/cmi5/result/extensions/progress': value,
	// 		},
	// 	}
	// }
	return await send(payload)
}

export async function send(statement: Statement): Promise<AxiosResponse<any>> {
	let resp
	try {
		resp = await axios.post(
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
	// probably good to return response to general transport
	return resp
}

export async function voidify(req: express.Request, id: string) {
	const payload: Statement = {
		actor: {
			account: {
				homePage: HomePage,
				name: req.user.id,
			},
			name: req.user.givenName,
			objectType: 'Agent',
		},
		object: {
			id,
			objectType: 'StatementRef',
		},
		verb: {
			display: {
				en: Labels[Verb.Voided],
			},
			id: Verb.Voided,
		},
	}
	await send(payload)
}
