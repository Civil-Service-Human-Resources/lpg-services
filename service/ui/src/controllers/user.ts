import * as config from 'config'
import {Request, Response} from 'express'
import * as template from 'ui/template'
import * as request from 'request'
import {updateUser} from '../../dist/controllers/user'

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
	let updateProfileObject = {
		userName: req.body.userName,
		CshrUser: {
			profession: req.body.profession,
			grade: req.body.grade,
			department: req.body.department,
		},
	}

	let options = {
		uri:
			config.get('authentication.serviceUrl') + '/scim2/Users/' + req.user.id,
		method: 'PUT',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(updateProfileObject),
		rejectUnauthorized: false, //Jen - TODO: Is there a securer way to do this?
		auth: {
			user: config.get('authentication.serviceAdmin'),
			pass: config.get('authentication.servicePassword'),
		},
	}

	request(options, function(error: Error, response: Response, body: Body) {
		if (!error && response.statusCode == 200) {
			let updatedUser = JSON.parse(body).CshrUser
			updateUserObject(req, updatedUser)

			res.send(renderProfile(req.user))
		} else {
			res.send(console.log(error))
		}
	})
}

function updateUserObject(req: Express.Request, updatedProfile: User) {
	req.user.profession = updatedProfile.profession
	req.user.grade = updatedProfile.grade
	req.user.department = updatedProfile.department
}
