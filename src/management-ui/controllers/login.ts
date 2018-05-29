import * as express from 'express'

import * as config from 'lib/config'
import * as passport from 'lib/config/passport'
import * as template from 'lib/ui/template'

export interface SignIn {
	loginFailed: boolean
	sessionDataKey: string
	authenticationServiceUrl: string
}

function renderSignIn(
	req: express.Request,
	res: express.Response,
	props: SignIn
) {
	return template.render('account/sign-in', req, res, props)
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
			renderSignIn(req, res, {
				authenticationServiceUrl: config.AUTHENTICATION.serviceUrl,
				loginFailed,
				sessionDataKey,
			})
		)
	}
}

export function signOut(req: express.Request, res: express.Response) {
	passport.logout(
		config.AUTHENTICATION.serviceUrl,
		config.LPG_MANAGMENT_SERVER,
		req,
		res
	)
}
