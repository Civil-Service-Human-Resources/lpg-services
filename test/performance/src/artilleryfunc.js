const config = require('./config')

module.exports = {
	setLoginBody: setLoginBody,
	logHeaders: logHeaders,
}

function setLoginBody(requestParams, context, ee, next) {
	requestParams.form = {
		username: context.vars.username,
		password: context.vars.password,
		_csrf: context.vars.csrf.value,
	}
	return next()
}

function logHeaders(requestParams, response, context, ee, next) {
	console.log(requestParams)
	return next()
}
