import * as dotenv from 'dotenv'
import * as path from 'path'
import 'reflect-metadata'

export const ONE_YEAR_IN_SECONDS = 31536000

export const ENV = process.env.NODE_ENV || 'development'
export const PRODUCTION_ENV = ENV === 'production'
export const PROFILE = process.env.ENV_PROFILE || 'local'
export const VER = process.env.npm_package_version

export const STATIC_DIR = path.join(`${__dirname}/../../../views`)

export const IS_DEV = ENV === 'development'

if (IS_DEV) {
	console.log('Loading env from .env file')
	dotenv.config({
		path: path.resolve(__dirname + '/../../../.env'),
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
	jwtKey: env.JWT_KEY || 'key',
	managementId: env.OAUTH_CLIENT_ID || 'f90a4080-e5e9-4a80-ace4-f738b4c9c30e',
	managementSecret: env.OAUTH_CLIENT_SECRET || 'test',
	serviceUrl: env.AUTHENTICATION_SERVICE_URL || 'http://localhost:8080',
})

export const COOKIE = set({
	maxAge: Number(env.COOKIE_AGE_IN_MILLISECONDS) || 15768000,
})

export const COURSE_CATALOGUE = set({
	url: env.COURSE_CATALOGUE_URL || 'http://localhost:9001',
})

export const CSL_SERVICE = set({
	url: env.CSL_SERVICE_URL || 'http://localhost:9003',
})

export const GOOGLE_ANALYTICS_CSP_ORIGINS =
	env.GOOGLE_ANALYTICS_CSP_ORIGINS || '*.google-analytics.com,*.analytics.google.com,https://www.googletagmanager.com'

export const GOOGLE_ANALYTICS_ID = env.GOOGLE_ANALYTICS_ID || 'UA-22141655-4'

export const GOOGLE_ANALYTICS_CODE = `<script>
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', '${GOOGLE_ANALYTICS_ID}', { anonymize_ip: true });
</script>`

export const LEARNER_RECORD = set({
	url: env.LEARNER_RECORD_URL || 'http://localhost:9000',
})

export const LOGGING_LEVEL = env.LOGGING_LEVEL || 'INFO'

export const LPG_UI_SERVER = env.LPG_UI_SERVER || 'http://localhost:3001'

export const BACKEND_SERVER_PATH = env.BACKEND_SERVER_PATH || 'api'

export const SESSION_SECRET = env.SESSION_SECRET || 'dcOVe-ZW3ul77l23GiQSNbTJtMRio87G2yUOUAk_otcbL3uywfyLMZ9NBmDMuuOt'

export const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY

export const REGISTRY_SERVICE_URL = env.REGISTRY_SERVICE_URL || 'http://localhost:9002'

export const LPG_MANAGEMENT_URL = env.LPG_MANAGEMENT_SERVER || 'http://localhost:3005'

export const REQUEST_TIMEOUT = Number(env.REQUEST_TIMEOUT) || 60000

export const APPLICATIONINSIGHTS_CONNECTION_STRING = env.APPLICATIONINSIGHTS_CONNECTION_STRING

export const SERVER_TIMEOUT_MS = Number(env.SERVER_TIMEOUT_MS) || 240000

export const CONTACT_EMAIL = env.CONTACT_EMAIL

export const CONTACT_NUMBER = env.CONTACT_NUMBER || '020 3640 7985'

export const REDIS = set({
	host: env.REDIS_HOST || 'localhost',
	keyPrefix: env.REDIS_KEY_PREFIX || 'csl_frontend_',
	password: env.REDIS_PASSWORD || '',
	port: +(env.REDIS_PORT || '6379'),
})

export const ORG_REDIS = set({
	defaultTTL: +(env.ORG_REDIS_TTL || '604800'),
})

export const PROFILE_REDIS = set({
	defaultTTL: +(env.PROFILE_REDIS_TTL || '604800'),
})

export const GRADE_REDIS = set({
	defaultTTL: +(env.GRADE_REDIS_TTL || '604800'),
})

export const AOW_REDIS = set({
	defaultTTL: +(env.AOW_REDIS_TTL || '604800'),
})

export const INTEREST_REDIS = set({
	defaultTTL: +(env.INTEREST_REDIS_TTL || '604800'),
})

export const STATIC_ASSET_ROOT = env.STATIC_ASSET_ROOT
export const STATIC_ASSET_TTL = env.STATIC_ASSET_TTL

export const TOKEN_EXPIRY_BUFFER = Number(env.TOKEN_EXPIRY_BUFFER) || 30

export const FEEDBACK_URL = env.FEEDBACK_URL || 'ChangeMe'
