'use strict'
Object.defineProperty(exports, '__esModule', {value: true})
const dotenv = require('dotenv')
const fs = require('fs')
exports.PROFILE = process.env.ENV_PROFILE || 'local'
const envFile = '/keybase/team/lpg/dev/testenv'
try {
	if (fs.statSync(envFile).isFile()) {
		dotenv.config({path: envFile})
	}
} catch (err) {
	if (!process.env.CI) {
		warn(`
!!! Unable to load the env file at ${envFile} !!!

`)
	}
}
function getEnv(obj, attr) {
	return process.env[attr] || ''
}
function set(localValue, nonLocalValue) {
	if (exports.PROFILE === 'local') {
		return localValue
	}
	return nonLocalValue
}
function warn(msg) {
	if (process.stdout.isTTY && /-256(color)?$/i.test(process.env.TERM || '')) {
		console.log(`\u001b[33m${msg}\u001b[0m`)
	} else {
		console.log(msg)
	}
}
const env = new Proxy({}, {get: getEnv})
exports.WSO2_URL = set(
	'https://identity.local.cshr.digital:9443',
	`https://identity.${exports.PROFILE}.cshr.digital`
)
exports.WSO2_ADMIN_PASSWORD = env.WSO2_ADMIN_PASSWORD
exports.WSO2_ADMIN_USERNAME = env.WSO2_ADMIN_USERNAME
exports.BASIC_AUTH_PASSWORD = env.BASIC_AUTH_PASSWORD
exports.BASIC_AUTH_USERNAME = env.BASIC_AUTH_USERNAME
exports.PASSWORD = 'changeme!12'
exports.TEST_PASSWORD = 'password123'
exports.URL = set(
	'http://lpg.local.cshr.digital:3001/sign-in',
	`https://lpg.${exports.PROFILE}.cshr.digital/sign-in`
)
exports.BASE_URL = set(
	'http://lpg.local.cshr.digital:3001',
	`https://lpg.${exports.PROFILE}.cshr.digital`
)
exports.USERNAME = 'load@lpg.dev.cshr.digital'
exports.XAPI_URL = env.XAPI_URL || 'http://localhost:8083/data/xAPI'
exports.XAPI_PASS = '66f2b4fc001e3da992d23b57d8a7457655bea078'
exports.XAPI_USER = '1c0e1b6827606d7efed71e204939d048f94f842b'
//# sourceMappingURL=config.js.map
