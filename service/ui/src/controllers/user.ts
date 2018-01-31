<<<<<<< HEAD
import {Request, Response} from 'express'
import * as config from 'lib/config'
import * as passport from 'lib/config/passport'
import {User} from 'lib/model/user'
import * as template from 'lib/ui/template'
=======
import {default as axios, AxiosResponse} from 'axios'
import * as config from 'config'
import {Request, Response} from 'express'
import * as https from 'https'
import * as template from 'ui/template'
>>>>>>> Added create user functionality, additional tests for profile
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

function renderProfile(req: Request, props: Profile) {
	return template.render('profile/edit', req, props)
}

function renderSignIn(req: Request, props: SignIn) {
	return template.render('account/sign-in', req, props)
}

function updateUserObject(req: Request, updatedProfile: User) {
	const newUser = {...req.user, ...updatedProfile}
	req.login(newUser, () => {})
}

function validateForm(req: request) {
	const form = req.body
	const validInputs = {
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

<<<<<<< HEAD
export function signOut(req: Request, res: Response) {
	passport.logout(req, res)
=======
export interface NewUser {
	id: string
}

function renderSignIn(req: Request, props: SignIn) {
	return template.render('account/sign-in', req, props)
>>>>>>> Added create user functionality, additional tests for profile
}

export function tryUpdateProfile(req: Request, res: Response) {
	const validFields = validateForm(req)
	if (validFields) {
		res.send(renderProfile(req, {user: validFields, validFields: false}))
	} else {
		updateProfile(req, res)
	}
}

<<<<<<< HEAD
export function updateProfile(req: Request, res: Response) {
	const updateProfileObject = {
=======
const http = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false,
	}),
})

export async function createUser(username: string, password: string) {
	const url = config.get('authentication.serviceUrl') + '/scim2/Users/'
	const data = JSON.stringify({
		userName: username,
		password: password,
		emails: [
			{
				primary: true,
				value: username,
				type: 'work',
			},
		],
	})
	let resp: AxiosResponse<NewUser>
	try {
		resp = await http.post(url, data, {
			method: 'POST',
			headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
			auth: {
				username: config.get('authentication.serviceAdmin') as string,
				password: config.get('authentication.servicePassword') as string,
			},
		})
	} catch (err) {
		throw err
	}
	if (resp.status !== 201) {
		throw new Error(
			`Received response code ${resp.status} when expecting a 201`
		)
	}
	return resp.data.id
}

export let updateProfile = (req: Request, res: Response) => {
	let updateProfileObject = {
		userName: req.body.userName,
>>>>>>> Added create user functionality, additional tests for profile
		CshrUser: {
			department: req.body.department,
			grade: req.body.grade,
			profession: req.body.profession,
		},
		userName: req.body.userName,
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

	request(options, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			updateUserObject(req, updateProfileObject.CshrUser)
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
