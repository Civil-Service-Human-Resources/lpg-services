import * as express from 'express'
import * as model from 'lib/model'
import * as passport from 'passport'
import * as saml from 'passport-saml'

let strategy: saml.Strategy

function createUser(data: any) {
	const user = new model.User(
		data.id,
		data.emailAddress,
		data.nameID,
		data.nameIDFormat,
		data.sessionIndex
	)
	user.department = data.department
	user.profession = data.profession
	user.givenName = data.givenName
	user.grade = data.grade
	return user
}

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
				createUser({
					department: profile['http://wso2.org/claims/department'],
					emailAddress: profile.nameID,
					givenName: profile['http://wso2.org/claims/givenname'],
					grade: profile['http://wso2.org/claims/grade'],
					id: profile['http://wso2.org/claims/userid'],
					nameID: profile.nameID,
					nameIDFormat: profile.nameIDFormat,
					profession: profile['http://wso2.org/claims/profession'],
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
		done(null, createUser(JSON.parse(data)))
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

export function logout(req: express.Request, res: express.Response) {
	strategy.logout(req, (err, url) => {
		if (err) {
			res.sendStatus(500)
		} else {
			req.logout()
			res.redirect(url)
		}
	})
}
