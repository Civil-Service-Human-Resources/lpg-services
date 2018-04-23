const config = require('./config')
const axios = require('axios')

module.exports = {
	setLoginBody: setLoginBody,
	logAfterResponse: logAfterResponse,
	authLogin: authLogin,
	setAuthHeader: setAuthHeader,
	sessionDataKey: sessionDataKey,
	loginToWso2: loginToWso2,
	logBeforeRequest: logBeforeRequest,
	useCookie: useCookie,
}

let testCookie = {}
let triedLogin = false

function useCookie(requestParams, context, ee, next) {
	if (Object.keys(testCookie).length !== 0) {
		requestParams.headers.cookie = {'lpg-ui': testCookie}
	}
	next()
}

function loginToWso2(requestParams, response, context, ee, next) {
	if (
		Object.keys(testCookie).length === 0 &&
		testCookie.constructor === Object &&
		!triedLogin
	) {
		console.log('logging in')
		axiosOptions = {
			method: 'post',
			data: {
				emailAddress: config.USERNAME,
				password: config.PASSWORD,
				sessionDateKey: context.vars.sessionDataKey,
			},
			headers: {
				'Content-Type': 'application/json',
			},
		}

		let loginMethod = () => {
			let url = `https://identity.cshr.digital/commonauth`
			axios
				.post(url, axiosOptions)
				.then(response => {
					console.log('logged in')
					const regex = /lpg-ui=(.*?);/g

					testCookie = {'lpg-ui': regex.exec(response.headers['set-cookie'])[1]}

					next()
				})
				.catch(error => {
					console.log(error)
				})
		}
		triedLogin = true

		loginMethod()
	} else {
		requestParams.headers.cookie = testCookie

		next()
	}
}

function setLoginBody(requestParams, context, ee, next) {
	// requestParams.headers['Authorization'] = authLogin()
	requestParams.headers['Content-Type'] = 'application/json'
	requestParams.json = {
		emailAddress: config.USERNAME,
		password: config.PASSWORD,
		sessionDateKey: context.vars.sessionDataKey,
	}

	return next() // MUST be called for the scenario to continue
}

function sessionDataKey(requestParams, response, context, ee, next) {
	if (
		Object.keys(testCookie).length === 0 &&
		testCookie.constructor === Object
	) {
		let query = response.request.uri.query
		let matches = query.match(/sessionDataKey=([^&]*)/)
		context.vars['sessionDataKey'] = matches[1]
	}

	next()
}

function logAfterResponse(requestParams, response, context, ee, next) {
	return next()
}

function logBeforeRequest(requestParams, context, ee, next) {
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
