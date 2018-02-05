export const ENV = process.env.NODE_ENV || 'development'
export const PRODUCTION_ENV = ENV === 'production'

function set<T>(defaultValue: T, envValues: Record<string, T> = {}): T {
	const val = envValues[ENV]
	if (val === undefined) {
		return defaultValue
	}
	return val
}

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
		pass: process.env.XAPI_PASS || 'e8a8d35073eb61eb81d2c68ec929ac3c7c63e3cc',
		user: process.env.XAPI_USER || '0184b0eb9a0db1c30d4b0186c847b222a122a71f',
	},
	url: process.env.XAPI_URL || 'http://localhost:8081/data/xAPI',
})
