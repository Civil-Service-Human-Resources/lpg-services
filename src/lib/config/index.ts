import * as dotenv from 'dotenv'
import * as path from 'path'
import 'reflect-metadata'

export const ONE_YEAR_IN_SECONDS = 31536000

export const ENV = process.env.NODE_ENV || 'development'
export const PRODUCTION_ENV = ENV === 'production'
export const PROFILE = process.env.ENV_PROFILE || 'local'
export const VER = process.env.npm_package_version

if (ENV === 'development') {
	console.log('Loading env from .env file')
	dotenv.config({
		path: path.resolve(__dirname + '/../../../../.env'),
	})
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

const env: Record<string, string> = new Proxy({}, {get: getEnv})

export const AUTHENTICATION = set({
	clientId: env.OAUTH_CLIENT_ID || '9fbd4ae2-2db3-44c7-9544-88e80255b56e',
	clientSecret: env.OAUTH_CLIENT_SECRET || 'test',
	endpoints: set({
		authorization: env.OAUTH_AUTHORIZATION_ENDPOINT || '/oauth2/authorize',
		logout: env.AUTHENTICATION_SERVICE_LOGOUT_ENDPOINT || '/logout',
		resolve: env.AUTHENTICATION_SERVICE_RESOLVE_ENDPOINT || '/identity/resolve',
		token: env.OAUTH_TOKEN_ENDPOINT || '/oauth2/token',
	}),
	managementId: env.OAUTH_CLIENT_ID || 'f90a4080-e5e9-4a80-ace4-f738b4c9c30e',
	managementSecret: env.OAUTH_CLIENT_SECRET || 'test',
	serviceUrl: env.AUTHENTICATION_SERVICE_URL || 'http://localhost:8080',
})

export const COOKIE = set({
	maxAge: Number(env.COOKIE_AGE_IN_MILLISECONDS) || 15768000,
})

export const BOOKING_NOTIFY_TEMPLATE_IDS = {
	cancelled: 'cc525c34-1a31-4fa1-ab19-862fd223caab',
	cancelledLineManager: 'c00fac77-8448-41c9-b15c-23361ccef419',
	requested: 'ae678ea1-ae7a-42f3-aa27-037336b346c4',
	requestedLineManager: '659f8f61-d326-428e-996d-f890b61a2f96',
}

export const BOOKING_NOTIFY_RECIPIENTS = [
	'r.vaughan@kainos.com',
	'richard@cautionyourblast.com',
]

export const CONTENT_URL =
	env.CONTENT_URL || 'http://cdn.local.learn.civilservice.gov.uk/lpgdevcontent'

export const CONTENT_CONTAINER = env.CONTENT_CONTAINER || 'lpgdevcontent'

export const COURSE_CATALOGUE = set({
	url: env.COURSE_CATALOGUE_URL || 'http://localhost:9001',
})

export const CSL_SERVICE = set({
	url: env.CSL_SERVICE_URL || 'http://localhost:9003',
})

export const FEEDBACK_RECIPIENTS = [
	env.FEEDBACK_RECIPIENT || 'support@governmentcampus.co.uk',
]

export const FEEDBACK_TEMPLATE_ID = '3fca8e51-ee09-4c4d-904f-bbd00d58f28d'

export const GOOGLE_ANALYTICS_CSP_ORIGINS =
env.GOOGLE_ANALYTICS_CSP_ORIGINS || "*.google-analytics.com,*.analytics.google.com,https://www.googletagmanager.com"

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
	url: env.LEARNER_RECORD_URL || 'http://localhost:9000',
})

export const LOGGING_LEVEL = env.LOGGING_LEVEL || 'INFO'

export const LPG_UI_SERVER =
	env.LPG_UI_SERVER || 'http://localhost:3001'

export const LPG_MANAGMENT_SERVER =
	env.LPG_MANAGEMENT_SERVER || 'http://localhost:3005'

export const SESSION_SECRET =
	env.SESSION_SECRET ||
	'dcOVe-ZW3ul77l23GiQSNbTJtMRio87G2yUOUAk_otcbL3uywfyLMZ9NBmDMuuOt'

export const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY

export const REGISTRY_SERVICE_URL =
	env.REGISTRY_SERVICE_URL || 'http://localhost:9002'

export const CHECK_LINEMANAGER_URL =
	REGISTRY_SERVICE_URL + '/civilServants/manager'

export const REPORT_SERVICE = set({
	url: env.REPORT_SERVICE_URL || 'http://localhost:9004',
})

export const LPG_MANAGEMENT_URL =
	env.LPG_MANAGEMENT_SERVER || 'http://localhost:3005'

export const REQUEST_TIMEOUT = Number(env.REQUEST_TIMEOUT) || 60000

export const APPLICATIONINSIGHTS_CONNECTION_STRING = env.APPLICATIONINSIGHTS_CONNECTION_STRING || 'ai_key'

export const SERVER_TIMEOUT_MS = Number(env.SERVER_TIMEOUT_MS) || 240000

export const CONTACT_EMAIL = env.CONTACT_EMAIL

export const CONTACT_NUMBER = env.CONTACT_NUMBER || '020 3640 7985'

export const REDIS = set({
	host: env.REDIS_HOST || 'localhost',
	password: env.REDIS_PASSWORD || '',
	port: +(env.REDIS_PORT || '6379'),
})

export const ORG_REDIS = set({
	defaultTTL: +(env.ORG_REDIS_TTL || '604800'),
	host: env.ORG_REDIS_HOST || 'localhost',
	password: env.ORG_REDIS_PASSWORD || '',
	port: +(env.ORG_REDIS_PORT || '6379'),
})

export const STATIC_ASSET_ROOT = env.STATIC_ASSET_ROOT
export const STATIC_ASSET_TTL = env.STATIC_ASSET_TTL

export const TOKEN_EXPIRY_BUFFER = Number(env.TOKEN_EXPIRY_BUFFER) || 30

export const FEEDBACK_URL = env.FEEDBACK_URL || 'ChangeMe'
