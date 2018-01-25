import * as config from 'config'
import {Request, Response} from 'express'
import * as template from 'ui/template'
import * as request from 'request'
import {logout} from 'ui/config/passport'

export let signIn = (req: Request, res: Response) => {
	const sessionDataKey = req.query.sessionDataKey
	const loginFailed = req.query.authFailureMsg === 'login.fail.message'

	if (req.isAuthenticated()) {
		res.redirect('/profile')
	} else if (!sessionDataKey) {
		res.redirect('/authenticate')
	} else {
		res.send(
			renderSignIn(req, {
				authenticationServiceUrl: config.get('authentication.serviceUrl'),
				loginFailed,
				sessionDataKey,
			})
		)
	}
}

export let signOut = (req: Request, res: Response) => {
	logout(req, res)
}

export let resetPassword = (req: Request, res: Response) => {
	res.send(template.render('account/reset-password', req))
}

export let editProfile = (req: Request, res: Response) => {
	res.send(renderProfile(req, {user: req.user, updateFailed: false}))
}

export let editProfileComplete = (req: Request, res: Response) => {
	res.send(template.render('profile/edit-success', req))
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

interface IdentityServiceUser {
	userName: string
	CshrUser: User
}

export interface Profile {
	user: User
	identityServerFailed?: boolean
	errors?: object
}

function renderSignIn(req: Request, props: SignIn) {
	return template.render('account/sign-in', req, props)
}

function renderProfile(req: Request, props: Profile) {
	return template.render('profile/edit', req, props)
}

function tryUpdateProfile = (req: Request, res: Response) => {
    let errors = validateForm(req)
    if (errors) {
        console.log(errors)
        res.send(renderProfile(req, {user: req.user, errors: errors}))
    } else {
    	updateProfile(req, res)
	}
}
export let updateProfile = (req: Request, res: Response) => {
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
			// user: config.get('authentication.serviceAdmin'),
			// pass: config.get('authentication.servicePassword'),
		},
	}

	request(options, (error: Error, response: Response, body: Body) => {
		if (!error && response.statusCode == 200) {
			updateUserObject(req, updateProfileObject.CshrUser)
			res.redirect('/profile-updated')
		} else {
			res.send(renderProfile(req, {user: req.user, identityServerFailed: true}))
		}
	})
}


function updateUserObject(req: Request, updatedProfile: User) {
	let newUser = {...req.user, ...updatedProfile}
	req.login(newUser, () => {})
}

function validateForm(req: request) {
	let areErrors: boolean
	let inputsValid = {
		userName: true,
		department: true,
		profession: true,
		grade: true,
	}
	let form = req.body
	console.log(form)

	for (let input in form) {
		if (/\S/.test(form[input])) {
			inputsValid[input] = true
		} else {
			areErrors = true
		}
	}

	if (areErrors) {
		return inputsValid
	}
}
