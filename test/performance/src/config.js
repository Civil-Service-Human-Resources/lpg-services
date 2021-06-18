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

exports.PASSWORD = env.PASSWORD
exports.URL = set(
	'http://local.learn.civilservice.gov.uk/sign-in',
	`https://${exports.PROFILE}.learn.civilservice.gov.uk/sign-in`
)
exports.BASE_URL = set(
	'http://local.learn.civilservice.gov.uk:3001',
	`https://${exports.PROFILE}.learn.civilservice.gov.uk`
)
exports.USERNAME = env.USERNAME
//# sourceMappingURL=config.js.map
