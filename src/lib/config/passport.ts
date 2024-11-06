import {plainToInstance} from 'class-transformer'
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import * as config from 'lib/config/index'
import {getLogger} from 'lib/logger'
import {createUser, User} from 'lib/model'
import * as model from 'lib/model'
import {
	fetchNewProfile,
	fetchProfile,
	removeProfileFromCache,
	updateProfileCache,
} from 'lib/service/civilServantRegistry/csrsService'
import {IdentityDetails} from 'lib/service/identity/models/identityDetails'
import * as passport from 'passport'
import * as oauth2 from 'passport-oauth2'

const logger = getLogger('config/passport')

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
	const strategy = new oauth2.Strategy(
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
				const identityDetails = new IdentityDetails(token.user_name, token.email, token.authorities, accessToken)
				return cb(null, identityDetails)
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
		let identity: IdentityDetails
		try {
			identity = plainToInstance(IdentityDetails, JSON.parse(data) as IdentityDetails)
			let csrsProfile = await fetchProfile(identity.uid, identity.accessToken)
			if (csrsProfile.shouldRefresh) {
				csrsProfile = await fetchNewProfile(identity.accessToken)
			}
			if (!csrsProfile.uiLoggedIn) {
				csrsProfile.uiLoggedIn = true
				await updateProfileCache(csrsProfile)
			}
			const user = createUser(identity, csrsProfile)
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
			res.redirect(redirectTo)
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
	passport.authenticate('oauth2', {
		failureFlash: true,
		failureRedirect: '/',
	})(req, res, next)
}

export async function logOutMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
	const user = req.user as User
	if (user.uiShouldLogout) {
		await logout(req, res)
	} else {
		next()
	}
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
	req: express.Request,
	res: express.Response
) {
	if (req.isAuthenticated()) {
		const user: User = req.user
		const redirectTo = req.user.isAdmin() && user.managementLoggedIn ?
			config.LPG_MANAGEMENT_URL + "/sign-out" : config.AUTHENTICATION.serviceUrl + config.AUTHENTICATION.endpoints.logout
		await removeProfileFromCache(user.id)
		req.session!.destroy(() => {
			res.redirect(redirectTo)
		})
	} else {
		res.redirect(config.LPG_UI_SERVER)
	}
}
