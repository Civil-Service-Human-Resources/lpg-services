import * as dotenv from 'dotenv'
import * as fs from 'fs'

export const ENV = process.env.NODE_ENV || 'development'
export const PRODUCTION_ENV = ENV === 'production'

if (ENV === 'development') {
	const envFile = '/keybase/team/lpg/dev/dotenv'
	try {
		if (!fs.statSync(envFile).isFile()) {
			throw new Error(`File not found: ${envFile}`)
		}
		dotenv.config({path: envFile})
	} catch (err) {
		warn(`
!!! Unable to load the env file at ${envFile} !!!

`)
	}
}

function getEnv(obj: any, attr: string) {
	return process.env[attr] || ''
}

function set<T>(defaultValue: T, envValues: Record<string, T> = {}): T {
	const val = envValues[ENV]
	if (val === undefined) {
		return defaultValue
	}
	return val
}

function warn(msg: string) {
	if (process.stdout.isTTY && /-256(color)?$/i.test(process.env.TERM || '')) {
		console.log(`\u001b[33m${msg}\u001b[0m`)
	} else {
		console.log(msg)
	}
}

const env: Record<string, string> = new Proxy({}, {get: getEnv})

export const AWS = set({
	accessKeyId: env.AWS_ACCESS_KEY_ID,
	region: env.REGION || 'eu-west-2',
	secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
})

export const AUTHENTICATION = set({
	serviceAdmin: 'admin@cslearning.gov.uk',
	servicePassword: 'admin',
	serviceUrl:
		env.AUTHENTICATION_SERVICE_URL ||
		'https://identity.local.cshr.digital:9443',
})

export const FEEDBACK_RECIPIENTS = ['tav@kainos.com']

export const FEEDBACK_TEMPLATE_ID = '3fca8e51-ee09-4c4d-904f-bbd00d58f28d'

export const GOV_NOTIFY_API_KEY =
	env.GOV_NOTIFY_API_KEY ||
	'test-22877568-4bca-40f9-8f54-8bf7922583cf-e2f80f22-e3de-4007-9ce2-b50a2b5785b7'

export const LOGGING = set(
	{
		appenders: {
			out: {type: 'console'},
		},
		categories: {
			default: {appenders: ['out'], level: 'info'},
		},
	},
	{
		development: {
			appenders: {
				out: {type: 'console'},
			},
			categories: {
				default: {appenders: ['out'], level: 'debug'},
			},
		},
	}
)

export const LPG_UI_SERVER = env.LPG_UI_SERVER || 'lpg.local.cshr.digital:3001'

export const POSTGRES =
	env.POSTGRES || 'postgres://user:password@localhost:5433/lpg'

export const SESSION_SECRET =
	env.SESSION_SECRET ||
	'dcOVe-ZW3ul77l23GiQSNbTJtMRio87G2yUOUAk_otcbL3uywfyLMZ9NBmDMuuOt'

export const XAPI = set({
	activityBaseUri: 'http://cslearning.gov.uk/courses',
	auth: {
		password: env.XAPI_PASS || '1c0e1b6827606d7efed71e204939d048f94f842b',
		username: env.XAPI_USER || '66f2b4fc001e3da992d23b57d8a7457655bea078',
	},
	url: env.XAPI_URL || 'http://localhost:8083/data/xAPI',
})

export const LEARNER_RECORD = set({
	url: env.LEARNER_RECORD_URL || 'http://localhost:9000',
})

export const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY
