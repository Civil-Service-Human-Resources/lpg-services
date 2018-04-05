const config = require('./config')

module.exports = {
	setLoginBody: setLoginBody,
	logAfterResponse: logAfterResponse,
	authLogin: authLogin,
	setAuthHeader: setAuthHeader,
	sessionDataKey: sessionDataKey,
}

function setLoginBody(requestParams, context, ee, next) {
	requestParams.headers['Authorization'] = authLogin()
	requestParams.headers['Content-Type'] = 'application/json'
	requestParams.json = {
		emailAddress: config.USERNAME,
		password: config.PASSWORD,
		sessionDateKey: context.vars.sessionDataKey,
	}

	return next() // MUST be called for the scenario to continue
}

function sessionDataKey(requestParams, response, context, ee, next) {
	let query = response.request.uri.query
	let matches = query.match(/sessionDataKey=([^&]*)/)
	context.vars['sessionDataKey'] = matches[1]
	next()
}

function logAfterResponse(requestParams, response, context, ee, next) {
	//use this to log things after a response
	return next()
}

function authLogin() {
	let auth = new Buffer(
		config.BASIC_AUTH_USERNAME + ':' + config.BASIC_AUTH_PASSWORD
	).toString('base64')

	return 'Basic ' + auth
}

function setAuthHeader(requestParams, context, ee, next) {
	requestParams.headers['Authorization'] = authLogin()
	requestParams.headers['Content-Type'] = 'application/json'

	next()
}
