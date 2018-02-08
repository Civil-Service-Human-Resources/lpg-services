import {Request, Response} from 'express'
import * as config from 'lib/config'
import * as passport from 'lib/config/passport'
import {User} from 'lib/model/user'
import * as template from 'lib/ui/template'
import * as request from 'request'

export interface Profile {
	user: User
	identityServerFailed?: boolean
	validFields?: boolean
}

export interface SignIn {
	loginFailed: boolean
	sessionDataKey: string
	authenticationServiceUrl: string
}

function renderSignIn(req: Request, props: SignIn) {
	return template.render('account/sign-in', req, props)
}

function updateUserObject(req: Request, updatedProfile: User) {
	let cshrUserObject = updatedProfile.CshrUser

	let newUser = {
		...req.user,
		givenName: updatedProfile.name.givenName,
		...cshrUserObject,
	}
	req.login(newUser, () => {})
}

function validateForm(req: request) {
	const form = req.body
	const validInputs = {
		givenName: form.givenName,
		department: form.department,
		grade: form.grade,
		profession: form.profession,
	}
	let areErrors = false
	for (const input in form) {
		if (!/\S/.test(form[input])) {
			validInputs[input] = false
			areErrors = true
		}
	}
	if (areErrors) {
		return validInputs
	}
}

export function editProfile(req: Request, res: Response) {
	res.send(
		renderProfile(req, {
			user: req.user,
			validFields: true,
		})
	)
}

export function editProfileComplete(req: Request, res: Response) {
	res.send(template.render('profile/edit-success', req))
}

export function resetPassword(req: Request, res: Response) {
	res.send(template.render('account/reset-password', req))
}

export function signIn(req: Request, res: Response) {
	const sessionDataKey = req.query.sessionDataKey
	const loginFailed = req.query.authFailureMsg === 'login.fail.message'

	if (req.isAuthenticated()) {
		res.redirect('/profile')
	} else if (!sessionDataKey) {
		res.redirect('/authenticate')
	} else {
		res.send(
			renderSignIn(req, {
				authenticationServiceUrl: config.AUTHENTICATION.serviceUrl,
				loginFailed,
				sessionDataKey,
			})
		)
	}
}
export interface User {
	id: string
	email: string
	givenName: string
	department: string
	profession: string
	grade: string
}

export function signOut(req: Request, res: Response) {
	passport.logout(req, res)
}

export function tryUpdateProfile(req: Request, res: Response) {
	const validFields = validateForm(req)
	if (validFields) {
		res.send(renderProfile(req, {user: validFields, validFields: false}))
	} else {
		updateProfile(req, res)
	}
}

function renderProfile(req: Request, props: Profile) {
	return template.render('profile/edit', req, props)
}

export let updateProfile = (req: Request, res: Response) => {
	let updateProfileObject = {
		userName: req.body.userName,
		name: {givenName: req.body.givenName},
		CshrUser: {
			profession: req.body.profession,
			grade: req.body.grade,
			department: req.body.department,
		},
	}

	const options = {
		auth: {
			pass: config.AUTHENTICATION.servicePassword,
			user: config.AUTHENTICATION.serviceAdmin,
		},
		body: JSON.stringify(updateProfileObject),
		headers: {'Content-Type': 'application/json'},
		method: 'PUT',
		rejectUnauthorized: false, //Jen - TODO: Is there a securer way to do this?
		uri: config.AUTHENTICATION.serviceUrl + '/scim2/Users/' + req.user.id,
	}

	request(options, (error: Error, response: Response, body: Body) => {
		if (!error && response.statusCode == 200) {
			updateUserObject(req, updateProfileObject)
			res.redirect('/profile-updated')
		} else {
			res.send(
				renderProfile(req, {
					identityServerFailed: true,
					user: req.user,
				})
			)
		}
	})
}
