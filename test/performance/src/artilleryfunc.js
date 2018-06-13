const config = require('./config')
const cheerio = require('cheerio')
const axios = require('axios')

module.exports = {
	getTokens: getTokens,
	setLoginBody: setLoginBody,
	logHeaders: logHeaders,
}

let csrf = {}

function getTokens(requestParams, response, context, ee, next) {
	let $ = cheerio.load(response.body)
	csrf = $('input[type="hidden"]').val()
	return next()
}

function setLoginBody(requestParams, context, ee, next) {
	requestParams.headers['Content-Type'] = 'multipart/form-data'
	requestParams.json = {
		username: config.USERNAME,
		password: config.PASSWORD,
		_csrf: csrf,
	}

	return next() // MUST be called for the scenario to continue
}

function logHeaders(requestParams, response, context, ee, next) {
	console.log(response.req.path)
	console.log(response.statusCode)
	console.log(response.headers)
	console.log(response.body)
	return next() // MUST be called for the scenario to continue
}
