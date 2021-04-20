import axios from 'axios'
import * as express from 'express'
import * as config from 'lib/config'
import * as datetime from 'lib/datetime'
import * as model from 'lib/model'
import {getLogger} from 'lib/logger'

const logger = getLogger('lib/xapi')

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
		contextActivities?: {
			category?: Array<{id: string}>
			parent?: Array<{id: string}>
		}
		extensions?: Record<string, any>
		registration?: string
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
		completion?: boolean
		duration?: string
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
	Course = 'http://adlnet.gov/expapi/activities/course',
	Event = 'http://adlnet.gov/expapi/activities/event',
	ELearning = 'http://cslearning.gov.uk/activities/elearning',
	FaceToFace = 'http://cslearning.gov.uk/activities/face-to-face',
	Link = 'http://adlnet.gov/expapi/activities/link',
	Video = 'https://w3id.org/xapi/acrossx/activities/video',
	File = 'http://adlnet.gov/expapi/activities/file',
}

export const Category = {
	Video: 'https://w3id.org/xapi/video',
}

export const Extension = {
	CancelReason: 'http://cslearning.gov.uk/extension/cancelReason',
	Payment: 'http://cslearning.gov.uk/extension/payment',
	VideoLength: 'https://w3id.org/xapi/video/extensions/length',
	VideoPlayedSegments: 'https://w3id.org/xapi/video/extensions/played-segments',
	VideoProgress: 'https://w3id.org/xapi/video/extensions/progress',
	VideoSessionID: 'https://w3id.org/xapi/video/extensions/session-id',
	VideoTime: 'https://w3id.org/xapi/video/extensions/time',
	VideoTimeFrom: 'https://w3id.org/xapi/video/extensions/time-from',
	VideoTimeTo: 'https://w3id.org/xapi/video/extensions/time-to',
}

export const ExtensionPlacements = {
	[Extension.CancelReason]: Placement.Result,
	[Extension.Payment]: Placement.Result,
	[Extension.VideoLength]: Placement.Context,
	[Extension.VideoPlayedSegments]: Placement.Result,
	[Extension.VideoProgress]: Placement.Result,
	[Extension.VideoSessionID]: Placement.Context,
	[Extension.VideoTime]: Placement.Result,
	[Extension.VideoTimeFrom]: Placement.Result,
	[Extension.VideoTimeTo]: Placement.Result,
}

export const ExtensionValidators = {
	[Extension.VideoLength]: requireNumber('VideoLength'),
	[Extension.VideoPlayedSegments]: requireString('VideoPlayedSegments'),
	[Extension.VideoProgress]: (val: any) => {
		if (typeof val !== 'number') {
			throw new Error(
				`xAPI VideoProgress extension value must be a number. received: ${val}`
			)
		}
		if (val < 0 || val > 1) {
			throw new Error(
				`xAPI VideoProgress extension value must be within the range 0 to 1. received: ${val}`
			)
		}
	},
	[Extension.VideoSessionID]: requireString('VideoSessionID', true),
	[Extension.VideoTime]: requireNumber('VideoTime'),
	[Extension.VideoTimeFrom]: requireNumber('VideoTimeFrom'),
	[Extension.VideoTimeTo]: requireNumber('VideoTimeTo'),
}

export const HomePage = 'https://cslearning.gov.uk/'

export const ResultValidators = {
	completion: (val: any) => {
		if (typeof val !== 'boolean') {
			throw new Error(
				`xAPI completion value must be a boolean. received: ${val}`
			)
		}
		return val
	},
	duration: (val: any) => {
		if (typeof val === 'string') {
			if (!datetime.parseDuration(val)) {
				throw new Error(
					`xAPI duration value must be an ISO 8601 formatted duration. received: ${val}`
				)
			}
			return val
		}
		if (typeof val === 'number') {
			return datetime.formatDuration(val)
		}
		throw new Error(
			`xAPI duration value must be an ISO 8601 formatted duration. received: ${val}`
		)
	},
}

export const Verb = {
	Archived: 'https://w3id.org/xapi/dod-isd/verbs/archived',
	Completed: 'http://adlnet.gov/expapi/verbs/completed',
	Disliked: 'https://w3id.org/xapi/acrossx/verbs/disliked',
	Experienced: 'http://adlnet.gov/expapi/verbs/experienced',
	Failed: 'http://adlnet.gov/expapi/verbs/failed',
	Initialised: 'http://adlnet.gov/expapi/verbs/initialized',
	Liked: 'https://w3id.org/xapi/acrossx/verbs/liked',
	Passed: 'http://adlnet.gov/expapi/verbs/passed',
	PausedVideo: 'https://w3id.org/xapi/video/verbs/paused',
	PlayedVideo: 'https://w3id.org/xapi/video/verbs/played',
	Rated: 'http://id.tincanapi.com/verb/rated',
	Registered: 'http://adlnet.gov/expapi/verbs/registered',
	SeekedVideo: 'https://w3id.org/xapi/video/verbs/seeked',
	Skipped: 'http://id.tincanapi.com/verb/skipped',
	Terminated: 'http://adlnet.gov/expapi/verbs/terminated',
	Unregistered: 'http://adlnet.gov/expapi/verbs/unregistered',
	Viewed: 'http://id.tincanapi.com/verb/viewed',
	Voided: 'http://adlnet.gov/expapi/verbs/voided',
}

export const Labels: Record<string, string> = {
	[Verb.Archived]: 'archived',
	[Verb.Completed]: 'completed',
	[Verb.Disliked]: 'disliked',
	[Verb.Experienced]: 'experienced',
	[Verb.Failed]: 'failed',
	[Verb.Initialised]: 'initialised',
	[Verb.Liked]: 'liked',
	[Verb.Passed]: 'passed',
	[Verb.PausedVideo]: 'paused video',
	[Verb.PlayedVideo]: 'played video',
	[Verb.Rated]: 'rated',
	[Verb.Registered]: 'registered',
	[Verb.SeekedVideo]: 'seeked',
	[Verb.Skipped]: 'skipped',
	[Verb.Terminated]: 'terminated',
	[Verb.Unregistered]: 'unregistered',
	[Verb.Viewed]: 'viewed',
	[Verb.Voided]: 'voided',
}

// Extensions required for each verb for the various profiles we are supporting.
export const RequiredExtensions = {
	video: {
		[Verb.Completed]: [
			Extension.VideoPlayedSegments,
			Extension.VideoProgress,
			Extension.VideoSessionID,
			Extension.VideoTime,
		],
		[Verb.PausedVideo]: [
			Extension.VideoPlayedSegments,
			Extension.VideoProgress,
			Extension.VideoSessionID,
			Extension.VideoTime,
		],
		[Verb.PlayedVideo]: [Extension.VideoSessionID, Extension.VideoTime],
		[Verb.Terminated]: [
			Extension.VideoPlayedSegments,
			Extension.VideoProgress,
			Extension.VideoSessionID,
			Extension.VideoTime,
		],
		[Verb.SeekedVideo]: [
			Extension.VideoSessionID,
			Extension.VideoTimeFrom,
			Extension.VideoTimeTo,
		],
	},
}

for (const verb of Object.values(Verb)) {
	if (!Labels[verb]) {
		throw new Error(`Missing label for the xAPI verb: ${verb}`)
	}
}

function requireNumber(extensionName: string) {
	return (val: any) => {
		if (typeof val !== 'number') {
			throw new Error(
				`xAPI ${extensionName} extension value must be a number. received: ${val}`
			)
		}
	}
}

function requireString(extensionName: string, required = false) {
	return (val: any) => {
		if (typeof val !== 'string') {
			throw new Error(
				`xAPI ${extensionName} extension value must be a string. received: ${val}`
			)
		}
		if (required && !val) {
			throw new Error(
				`xAPI ${extensionName} extension value must not be an empty string.`
			)
		}
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
	event?: model.Event,
	resultData?: Record<string, any>
) {
	logger.debug(`This is xapi record for ${course}`)
	if (!Labels[verb]) {
		throw new Error(`Unknown xAPI verb: ${verb}`)
	}
	let type: Type
	if (module) {
		switch (module.type) {
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
			case 'file':
				type = Type.File
				break
			default:
				throw new Error(`Unknown module type ${module.type}`)
		}
	} else {
		type = Type.Course
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
			payload.context.contextActivities!.parent!.push({
				id: module.getActivityId(),
			})
		} else {
			payload.object.id = module.getActivityId()
		}
	}
	if (extensions) {
		const exts = Extension as Record<string, string | undefined>
		const seen = new Set()
		for (let [extension, value] of Object.entries(extensions)) {
			if (!extension.startsWith('http')) {
				if (!exts[extension]) {
					throw new Error(
						`Unable to find identifier for the "${extension}" extension`
					)
				}
				extension = exts[extension]!
			}
			const placement = ExtensionPlacements[extension]
			if (placement === undefined) {
				throw new Error(
					`Could not find placement location for the extension: ${extension}`
				)
			}
			const validate = ExtensionValidators[extension]
			if (validate) {
				validate(value)
			}
			switch (placement) {
				case Placement.Context:
					if (!payload.context) {
						payload.context = {extensions: {}}
					} else if (!payload.context.extensions) {
						payload.context.extensions = {}
					}
					payload.context!.extensions![extension] = value
					break
				case Placement.Result:
					if (!payload.result) {
						payload.result = {
							extensions: {},
						}
					}
					payload.result.extensions![extension] = value
					break
			}
			seen.add(extension)
		}
		// TODO(tav): Add profiles for other course types in future maybe.
		if (type === Type.Video) {
			const required = RequiredExtensions.video[verb]
			if (required) {
				for (const ext of required) {
					if (!seen.has(ext)) {
						throw new Error(`Missing extension <${ext}> for the video profile`)
					}
				}
			}
		}
	}
	if (resultData) {
		if (!payload.result) {
			payload.result = {}
		}
		for (const [prop, value] of Object.entries(resultData)) {
			switch (prop) {
				case 'completion':
					payload.result.completion = ResultValidators.completion(value)
					break
				case 'duration':
					payload.result.duration = ResultValidators.duration(value)
					break
				default:
					throw new Error(`Unknown xAPI result property "${prop}" received`)
			}
		}
	}
	switch (type) {
		case Type.Video:
			if (!payload.context) {
				payload.context = {
					contextActivities: {},
				}
			}
			payload.context.contextActivities!.category = [
				{
					id: Category.Video,
				},
			]
			break
	}
	return await send(payload)
}

export async function send(statement: Statement): Promise<string> {
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
	return resp.data[0]
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
