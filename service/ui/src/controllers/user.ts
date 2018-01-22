import * as config from 'config'
import {Request, Response} from 'express'
import * as template from 'ui/template'
import * as request from 'request'

export let signIn = (req: Request, res: Response) => {
	const sessionDataKey = req.query.sessionDataKey
	const loginFailed = req.query.authFailureMsg === 'login.fail.message'

	if (req.isAuthenticated()) {
		res.redirect('/profile')
	} else if (!sessionDataKey) {
		res.redirect('/authenticate')
	} else {
		res.send(
			renderSignIn({
				authenticationServiceUrl: config.get('authentication.serviceUrl'),
				loginFailed,
				sessionDataKey,
			})
		)
	}
}

export let signOut = (req: Request, res: Response) => {
	req.logout()
	res.redirect('/')
}

export let resetPassword = (req: Request, res: Response) => {
    res.send(template.render('account/reset-password'))
}

export let profile = (req: Request, res: Response) => {
	res.send(renderProfile(req.user))
}

export interface SignIn {
	loginFailed: boolean
	sessionDataKey: string
	authenticationServiceUrl: string
}

export interface User {
	id: string
	email: string
	department: string
	profession: string
	grade: string
}

function renderSignIn(props: SignIn) {
	return template.render('account/sign-in', props)
}

function renderProfile(props: User) {
	console.log(props)
	return template.render('profile', props)
}

export let updateUser = (req: Request, res: Response) => {
	let headers = {
		'Content-Type': 'application/json',
	}
	let options = {
		uri:
			config.get('authentication.serviceUrl') + '/scim2/Users/' + req.user.id,
		method: 'PUT',
		headers: headers,
		body: JSON.stringify(req.body),
		auth: {
			user: config.get('authentication.serviceAdmin'),
			pass: config.get('authentication.servicePassword'),
		},
	}
	console.log(JSON.stringify(req.body))
	console.log(options)
	// res.send()

	request(options, function(error: Error, response: Response, body: JSON) {
		if (!error && response.statusCode == 200) {
			console.log('done')
			console.log(body) // Print the shortened url.
			res.send(body)
		} else {
			res.send(console.log(error))
		}
	})
}
