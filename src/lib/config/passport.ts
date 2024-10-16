import {plainToInstance} from 'class-transformer'
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import * as config from 'lib/config/index'
import {IdentityDetails} from 'lib/identity'
import * as identity from 'lib/identity'
import {getLogger} from 'lib/logger'
import * as model from 'lib/model'
import * as registry from 'lib/registry'
import * as passport from 'passport'
import * as oauth2 from 'passport-oauth2'

const logger = getLogger('config/passport')

let strategy: oauth2.Strategy

export function configure(
	clientID: string,
	clientSecret: string,
	authorizationURL: string,
	tokenURL: string,
	app: express.Express,
	callbackURL: string
) {
	app.use(passport.initialize())
	app.use(passport.session())
	strategy = new oauth2.Strategy(
		{
			authorizationURL,
			callbackURL,
			clientID,
			clientSecret,
			tokenURL,
		},
		async (accessToken: string, refreshToken: string, profile: any, cb: oauth2.VerifyCallback) => {
			try {
				const token = jwt.decode(accessToken) as any
				const identityDetails = new IdentityDetails(token.email, token.user_name, token.authorities)
				const csrsProfile = await registry.login(accessToken, identityDetails)

				const user = model.User.createFromFullProfile(csrsProfile, identityDetails, accessToken)
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
		let user: model.User
		try {
			user = plainToInstance(model.User, JSON.parse(data) as model.User)
			done(null, user)
		} catch (error) {
			done(error, undefined)
		}
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

export function isAuthenticated(req: express.Request, res: express.Response, next: express.NextFunction) {
	const authenticated = req.isAuthenticated()

	if (authenticated) {
		const token: any = jwt.decode(req.user.accessToken)
		const nowEpochSeconds: number = Math.round(Date.now() / 1000)
		if (token !== null && (token.exp > (nowEpochSeconds + config.TOKEN_EXPIRY_BUFFER))) {
			return next()
		}
	}
	const session = req.session!
	session.redirectTo = req.originalUrl
	const authenticationServiceUrl = config.AUTHENTICATION.serviceUrl
	session.save(() => {
		req.logout()
		res.redirect(`${authenticationServiceUrl}/logout`)
	})
}

// @ts-ignore
export function hasRole(role: string) {
	return (req: express.Request, res: express.Response, next: express.NextFunction) => {
		if (req.user && req.user.hasRole(role)) {
			return next()
		}
		res.sendStatus(401)
	}
}

// @ts-ignore
export function hasAnyRole(roles: string[]) {
	return (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
	res.end()
}
