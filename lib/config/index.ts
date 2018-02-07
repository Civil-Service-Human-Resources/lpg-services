export const ENV = process.env.NODE_ENV || 'development'
export const PRODUCTION_ENV = ENV === 'production'

function set<T>(defaultValue: T, envValues: Record<string, T> = {}): T {
	const val = envValues[ENV]
	if (val === undefined) {
		return defaultValue
	}
	return val
}

export const AWS = set({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
	region: process.env.REGION || 'eu-west-2',
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
})

export const AUTHENTICATION = set({
	serviceAdmin: 'admin@cslearning.gov.uk',
	servicePassword: 'admin',
	serviceUrl:
		process.env.AUTHENTICATION_SERVICE_URL ||
		'https://identity.dev.cshr.digital:9443',
})

export const LOGGING = set(
	{
		appenders: [],
		levels: {
			'[all]': 'DEBUG',
		},
	},
	{
		development: {
			appenders: [{type: 'console'}],
			levels: {
				'[all]': 'DEBUG',
			},
		},
	}
)

export const SESSION_SECRET = set(
	process.env.SESSION_SECRET ||
		'dcOVe-ZW3ul77l23GiQSNbTJtMRio87G2yUOUAk_otcbL3uywfyLMZ9NBmDMuuOt'
)

export const XAPI = set({
	auth: {
		password:
			process.env.XAPI_PASS || '1c0e1b6827606d7efed71e204939d048f94f842b',
		username:
			process.env.XAPI_USER || '66f2b4fc001e3da992d23b57d8a7457655bea078',
	},
	url: process.env.XAPI_URL || 'http://localhost:8083/data/xAPI',
})

export const YOUTUBE_API_KEY = 'AIzaSyB0qRHFNFQGlfMAjCimxUPhxY8wKpIU94Y'
