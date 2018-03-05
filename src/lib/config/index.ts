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

export const BOOKING_ALERT_WEBHOOK = env.BOOKING_ALERT_WEBHOOK

export function BOOKING_CANCELLED_MSG(
	userName: string,
	courseTitle: string,
	emailAddress: string,
	date: string
) {
	return `*BOOKING CANCELLED*
user *${userName}* cancelled booking on *${courseTitle}*
*User Email*: ${emailAddress}
*Selected date*: ${date}`
}

export function BOOKING_COMPLETE_MSG(
	userName: string,
	courseTitle: string,
	emailAddress: string,
	date: string
) {
	return `*BOOKING COMPLETE*
user *${userName}* completed booking on *${courseTitle}*
*User Email*: ${emailAddress}
*Selected date*: ${date}`
}

export const COURSE_CATALOGUE = set({
	auth: {
		password: env.COURSE_CATALOGUE_PASS || 'password',
		username: env.COURSE_CATALOGUE_USER || 'user',
	},
	url: env.COURSE_CATALOGUE_URL || 'http://localhost:9001',
})

export const FEEDBACK_RECIPIENTS = [
	'max@cautionyourblast.com',
	'richard@cautionyourblast.com',
]

export const FEEDBACK_TEMPLATE_ID = '3fca8e51-ee09-4c4d-904f-bbd00d58f28d'

export const GOOGLE_ANALYTICS_ID = env.GOOGLE_ANALYTICS_ID || 'UA-22141655-4'

export const GOOGLE_ANALYTICS_CODE = `<script>
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}', { anonymize_ip: true });
</script>`

export const GOV_NOTIFY_API_KEY =
	env.GOV_NOTIFY_API_KEY ||
	'test-22877568-4bca-40f9-8f54-8bf7922583cf-e2f80f22-e3de-4007-9ce2-b50a2b5785b7'

export const LEARNER_RECORD = set({
	auth: {
		password: env.LEARNER_RECORD_PASS || 'password',
		username: env.LEARNER_RECORD_USER || 'user',
	},
	url: env.LEARNER_RECORD_URL || 'http://localhost:9000',
})

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

export const SESSION_SECRET =
	env.SESSION_SECRET ||
	'dcOVe-ZW3ul77l23GiQSNbTJtMRio87G2yUOUAk_otcbL3uywfyLMZ9NBmDMuuOt'

export const XAPI = set({
	auth: {
		password: env.XAPI_PASS || '1c0e1b6827606d7efed71e204939d048f94f842b',
		username: env.XAPI_USER || '66f2b4fc001e3da992d23b57d8a7457655bea078',
	},
	courseBaseUri: 'http://cslearning.gov.uk/courses',
	eventBaseUri: 'http://cslearning.gov.uk/events',
	moduleBaseUri: 'http://cslearning.gov.uk/modules',
	url: env.XAPI_URL || 'http://localhost:8083/data/xAPI',
})

export const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY
