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

exports.PASSWORD = 'test'
exports.TEST_PASSWORD = 'test'
exports.URL = set(
	'http://lpg.local.cshr.digital:3001/sign-in',
	`https://${exports.PROFILE}-lpg.cshr.digital/sign-in`
)
exports.BASE_URL = set(
	'http://lpg.local.cshr.digital:3001',
	`https://${exports.PROFILE}-lpg.cshr.digital`
)
exports.USERNAME = 'learner@domain.com'
//# sourceMappingURL=config.js.map
