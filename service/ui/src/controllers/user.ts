import {default as axios, AxiosResponse} from 'axios'
import * as config from 'config'
import {Request, Response} from 'express'
import * as https from 'https'
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
	res.send(
		renderProfile(req, {
			user: req.user,
			validFields: true,
		})
	)
}

export let editProfileComplete = (req: Request, res: Response) => {
	res.send(template.render('profile/edit-success', req))
}

export let tryUpdateProfile = (req: Request, res: Response) => {
	let validFields = validateForm(req)
	if (validFields) {
		res.send(renderProfile(req, {user: validFields, validFields: false}))
	} else {
		updateProfile(req, res)
	}
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

export interface Profile {
	user: User
	identityServerFailed?: boolean
	validFields?: boolean
}

export interface NewUser {
	id: string
}

function renderSignIn(req: Request, props: SignIn) {
	return template.render('account/sign-in', req, props)
}

function renderProfile(req: Request, props: Profile) {
	return template.render('profile/edit', req, props)
}

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

	request(options, (error: Error, response: Response, body: Body) => {
		if (!error && response.statusCode == 200) {
			updateUserObject(req, updateProfileObject.CshrUser)
			res.redirect('/profile-updated')
		} else {
			res.send(
				renderProfile(req, {
					user: req.user,
					identityServerFailed: true,
				})
			)
		}
	})
}

function updateUserObject(req: Request, updatedProfile: User) {
	let newUser = {...req.user, ...updatedProfile}
	req.login(newUser, () => {})
}

function validateForm(req: request) {
	let areErrors = false
	let form = req.body
	let validInputs = {
		department: form.department,
		profession: form.profession,
		grade: form.grade,
	}

	for (let input in form) {
		if (!/\S/.test(form[input])) {
			validInputs[input] = false
			areErrors = true
		}
	}

	if (areErrors) {
		return validInputs
	}
}
