import * as dotenv from 'dotenv'

export const PROFILE = process.env.ENV_PROFILE || 'local'

if (PROFILE === 'development') {
	dotenv.config()
}

function getEnv(obj: any, attr: string) {
	return process.env[attr] || ''
}

function set<T>(localValue: T, nonLocalValue: T): T {
	if (PROFILE === 'local') {
		return localValue
	}
	return nonLocalValue
}

const env: Record<string, string> = new Proxy({}, {get: getEnv})

export const WSO2_URL = set(
	'https://identity.develop.learn.civilservice.gov.uk:9443',
	`https://identity.${PROFILE}.learn.civilservice.gov.uk`
)

export const WSO2_ADMIN_PASSWORD = env.WSO2_ADMIN_PASSWORD
export const WSO2_ADMIN_USERNAME = env.WSO2_ADMIN_USERNAME

export const BASIC_AUTH_PASSWORD = env.BASIC_AUTH_PASSWORD
export const BASIC_AUTH_USERNAME = env.BASIC_AUTH_USERNAME

export const PASSWORD = 'test'

export const TEST_PASSWORD = 'test'

export const SAUCE_ACCESS_KEY = env.SAUCE_ACCESS_KEY
export const SAUCE_USERNAME = env.SAUCE_USERNAME

export const URL = set(
	'http://lpg.local.cshr.digital:3001/sign-in',
	`https://${PROFILE}-lpg.cshr.digital/sign-in`
)

export const BASE_URL = set(
	'http://develop.learn.civilservice.gov.uk:3001',
	`https://${PROFILE}.learn.civilservice.gov.uk`
)

export const USERNAME = 'learner@domain.com'
