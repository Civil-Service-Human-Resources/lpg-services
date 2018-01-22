import {Request, Response} from 'express'
import * as svelte from 'ui/svelte'
import * as config from 'config'

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
				loginFailed,
				sessionDataKey,
				authenticationServiceUrl: config.get('authentication.serviceUrl'),
			})
		)
	}
}

export let signOut = (req: Request, res: Response) => {
	req.logout()
	res.redirect('/')
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
	return svelte.render('sign-in', props)
}

function renderProfile(props: User) {
	return svelte.render('profile', props)
}
