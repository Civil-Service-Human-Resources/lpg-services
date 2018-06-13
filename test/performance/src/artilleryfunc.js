const config = require('./config')
const cheerio = require('cheerio')

module.exports = {
	getTokens: getTokens,
	setLoginBody: setLoginBody,
	logHeaders: logHeaders,
}

function setLoginBody(requestParams, context, ee, next) {
	requestParams.form = {
		username: config.USERNAME,
		password: config.PASSWORD,
		_csrf: context.vars.csrf.value,
	}
	return next()
}

function logHeaders(requestParams, response, context, ee, next) {
	console.log(requestParams)
	return next()
}
