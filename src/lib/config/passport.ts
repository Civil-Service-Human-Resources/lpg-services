import * as express from 'express'
import * as model from 'lib/model'
import * as passport from 'passport'
import * as saml from 'passport-saml'

let strategy: saml.Strategy

export function configure(
	issuer: string,
	authenticationServiceUrl: string,
	app: express.Express
) {
	app.use(passport.initialize())
	app.use(passport.session())

	strategy = new saml.Strategy(
		{
			acceptedClockSkewMs: -1,
			entryPoint: `${authenticationServiceUrl}/samlsso`,
			issuer,
			path: '/authenticate',
		},
		(profile: any, done: saml.VerifiedCallback) => {
			done(
				null,
				model.User.create({
					areasOfWork: profile['http://wso2.org/claims/profession'],
					department: profile['http://wso2.org/claims/department'],
					emailAddress: profile.nameID,
					givenName: profile['http://wso2.org/claims/givenname'],
					grade: profile['http://wso2.org/claims/grade'],
					id: profile['http://wso2.org/claims/userid'],
					nameID: profile.nameID,
					nameIDFormat: profile.nameIDFormat,
					roles: profile['http://wso2.org/claims/role'],
					sessionIndex: profile.sessionIndex,
				}),
				{}
			)
		}
	)

	passport.use(strategy)

	passport.serializeUser((user, done) => {
		done(null, JSON.stringify(user))
	})

	passport.deserializeUser<model.User, string>((data, done) => {
		done(null, model.User.create(JSON.parse(data)))
	})

	app.all(
		'/authenticate',
		passport.authenticate('saml', {
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
	if (req.isAuthenticated()) {
		return next()
	}
	const session = req.session!
	session.redirectTo = req.originalUrl
	session.save(() => {
		res.redirect('/authenticate')
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

export function logout(req: express.Request, res: express.Response) {
	strategy.logout(req, (err, url) => {
		req.logout()
		res.redirect(url)
	})
}
