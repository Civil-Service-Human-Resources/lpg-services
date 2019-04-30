import * as express from 'express'
import * as identity from 'lib/identity'
import * as model from 'lib/model'
import * as registry from 'lib/registry'
import * as log4js from 'log4js'
import * as passport from 'passport'
import * as oauth2 from 'passport-oauth2'
import * as config from "lib/config/index"

const logger = log4js.getLogger('config/passport')

let strategy: oauth2.Strategy

export function configure(
	clientID: string,
	clientSecret: string,
	authenticationServiceUrl: string,
	app: express.Express,
	callbackUrl: string
) {
	app.use(passport.initialize())
	app.use(passport.session())
	strategy = new oauth2.Strategy(
		{
			authorizationURL: `${authenticationServiceUrl}/oauth/authorize`,
			callbackURL: `${callbackUrl}/authenticate`,
			clientID,
			clientSecret,
			tokenURL: `${authenticationServiceUrl}/oauth/token`,
		},
		async (
			accessToken: string,
			refreshToken: string,
			profile: any,
			cb: oauth2.VerifyCallback
		) => {
			profile.accessToken = accessToken

			try {
				const identityDetails = await identity.getDetails(accessToken)
				const regDetails = await registry.profile(accessToken)

				const combined = {
					...profile,
					...identityDetails,
					...regDetails,
				}
				const user = model.User.create(combined)
				return cb(null, user)
			} catch (e) {
				logger.warn(`Error retrieving user profile information`, e)
				cb(e)
			}
		}
	)

	passport.use(strategy)

	passport.serializeUser((user, done) => {
		done(null, JSON.stringify(user))
	})

	passport.deserializeUser<model.User, string>(async (data, done) => {
		done(null, model.User.create(JSON.parse(data)))
	})

	app.all(
		'/authenticate',
		passport.authenticate('oauth2', {
			failureFlash: true,
			failureRedirect: '/',
		}),
		(req: express.Request, res: express.Response) => {
			const session = req.session
			if (!session) {
				console.log('passport: session not present on express request')
				res.sendStatus(500)
				return
			}
			let {redirectTo} = session
			if (!redirectTo) {
				redirectTo = '/'
			}
			delete session.redirectTo
			session.save(() => {
				res.redirect(redirectTo)
			})
		}
	)
}

export function isAuthenticated(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	const authenticated = req.isAuthenticated()
	if (authenticated) {
		return next()
	}
	const session = req.session!
	session.redirectTo = req.originalUrl
	const authenticationServiceUrl = config.AUTHENTICATION.serviceUrl
	session.save(() => {
		res.redirect(`${authenticationServiceUrl}/logout`)
	})
}

export function hasRole(role: string) {
	return (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		if (req.user && req.user.hasRole(role)) {
			return next()
		}
		res.sendStatus(401)
	}
}

export function hasAnyRole(roles: string[]) {
	return (
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		if (req.user && req.user.hasAnyRole(roles)) {
			return next()
		}
		res.sendStatus(401)
	}
}

export async function logout(
	authenticationServiceUrl: string,
	callbackUrl: string,
	req: express.Request,
	res: express.Response,
	accessToken: string
) {
	req.logout()
	await identity.logout(accessToken)
	res.redirect(`${authenticationServiceUrl}/logout?returnTo=${callbackUrl}`)
}
