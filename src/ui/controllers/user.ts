import axios from 'axios'
import * as express from 'express'
import * as https from 'https'
import * as config from 'lib/config'
import * as passport from 'lib/config/passport'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'

export interface Profile {
	user: model.User
	identityServerFailed?: boolean
	validFields?: boolean
}

export interface SignIn {
	loginFailed: boolean
	sessionDataKey: string
	authenticationServiceUrl: string
}

const http = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false,
	}),
})

function renderProfile(req: express.Request, props: Profile) {
	return template.render('profile/edit', req, props)
}

function renderSignIn(req: express.Request, props: SignIn) {
	return template.render('account/sign-in', req, props)
}

function updateUserObject(req: express.Request, updatedProfile: model.User) {
	const cshrUserObject = updatedProfile.CshrUser
	const newUser = {
		...req.user,
		givenName: updatedProfile.name.givenName,
		...cshrUserObject,
	}
	req.login(newUser, () => {})
}

function validateForm(req: express.Request) {
	const form = req.body
	const validInputs = {
		department: form.department,
		givenName: form.givenName,
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

export function editProfile(req: express.Request, res: express.Response) {
	res.send(
		renderProfile(req, {
			user: req.user,
			validFields: true,
		})
	)
}

export function editProfileComplete(
	req: express.Request,
	res: express.Response
) {
	res.send(template.render('profile/edit-success', req))
}

export function resetPassword(req: express.Request, res: express.Response) {
	res.send(template.render('account/reset-password', req))
}

export function signIn(req: express.Request, res: express.Response) {
	const sessionDataKey = req.query.sessionDataKey
	const loginFailed = req.query.authFailureMsg === 'login.fail.message'

	if (req.isAuthenticated()) {
		res.redirect('/')
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

export function signOut(req: express.Request, res: express.Response) {
	passport.logout(req, res)
}

export function tryUpdateProfile(req: express.Request, res: express.Response) {
	const validFields = validateForm(req)
	if (validFields) {
		res.send(renderProfile(req, {user: validFields, validFields: false}))
	} else {
		updateProfile(req, res)
	}
}

export function updateProfile(req: express.Request, res: express.Response) {
	const updateProfileObject = {
		CshrUser: {
			department: req.body.department,
			grade: req.body.grade,
			profession: req.body.profession,
		},
		name: {givenName: req.body.givenName},
		userName: req.body.userName,
	}
	const options = {
		auth: {
			password: config.AUTHENTICATION.servicePassword,
			username: config.AUTHENTICATION.serviceAdmin,
		},
		baseURL: config.AUTHENTICATION.serviceUrl,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	}
	http
		.put('/scim2/Users/' + req.user.id, updateProfileObject, options)
		.then(response => {
			updateUserObject(req, JSON.parse(response.config.data))
			res.redirect('/profile-updated')
		})
		.catch(error => {
			res.send(
				renderProfile(req, {
					identityServerFailed: true,
					user: req.user,
				})
			)
		})
}
