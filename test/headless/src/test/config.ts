import * as dotenv from 'dotenv'
import * as fs from 'fs'

export const PROFILE = process.env.ENV_PROFILE || 'local'

const envFile = '/keybase/team/lpg/dev/testenv'

try {
	if (fs.statSync(envFile).isFile()) {
		dotenv.config({path: envFile})
	}
} catch (err) {
	if (PROFILE === 'local') {
		warn(`
!!! Unable to load the env file at ${envFile} !!!

`)
	}
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

function warn(msg: string) {
	if (process.stdout.isTTY && /-256(color)?$/i.test(process.env.TERM || '')) {
		console.log(`\u001b[33m${msg}\u001b[0m`)
	} else {
		console.log(msg)
	}
}

const env: Record<string, string> = new Proxy({}, {get: getEnv})

export const WSO2_URL = set(
	'https://identity.local.cshr.digital:9443',
	`https://identity.${PROFILE}.cshr.digital`
)

export const WSO2_ADMIN_PASSWORD = env.WSO2_ADMIN_PASSWORD
export const WSO2_ADMIN_USERNAME = env.WSO2_ADMIN_USERNAME

export const BASIC_AUTH_PASSWORD = env.BASIC_AUTH_PASSWORD
export const BASIC_AUTH_USERNAME = env.BASIC_AUTH_USERNAME

export const PASSWORD = '1337h4x0r'

export const TEST_PASSWORD = 'password123'

export const URL = set(
	'https://lpg.local.cshr.digital:3001/sign-in',
	`https://lpg.${PROFILE}.cshr.digital/sign-in`
)

export const USERNAME = 'test@lpg.dev.cshr.digital'

export const XAPI_URL = env.XAPI_URL || 'http://localhost:8083/data/xAPI'
export const XAPI_PASS = '66f2b4fc001e3da992d23b57d8a7457655bea078'
export const XAPI_USER = '1c0e1b6827606d7efed71e204939d048f94f842b'
