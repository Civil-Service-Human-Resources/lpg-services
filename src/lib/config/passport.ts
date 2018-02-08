import {NextFunction, Request, Response} from 'express'
import * as passport from 'passport'
import {Strategy} from 'passport-saml'

let strategy: Strategy

export function configure(
	issuer: string,
	authenticationServiceUrl: string,
	app: Express.Application
) {
	app.use(passport.initialize())
	app.use(passport.session())

	strategy = new Strategy(
		{
			acceptedClockSkewMs: -1,
			entryPoint: `${authenticationServiceUrl}/samlsso`,
			issuer,
			path: '/authenticate',
		},
		(profile, done) => {
			done(null, {
				department: profile['http://wso2.org/claims/department'],
				emailAddress: profile.nameID,
				givenName: profile['http://wso2.org/claims/givenname'],
				grade: profile['http://wso2.org/claims/grade'],
				id: profile['http://wso2.org/claims/userid'],
				nameID: profile.nameID,
				nameIDFormat: profile.nameIDFormat,
				profession: profile['http://wso2.org/claims/profession'],
				sessionIndex: profile.sessionIndex,
			})
		}
	)

	passport.use(strategy)

	passport.serializeUser((user, done) => {
		done(null, JSON.stringify(user))
	})

	passport.deserializeUser((data, done) => {
		done(null, JSON.parse(data))
	})

	app.all(
		'/authenticate',
		passport.authenticate('saml', {
			failureFlash: true,
			failureRedirect: '/',
		}),
		(req, res) => {
			// TODO: remember URL accessed and redirect to, default to LPG UI home
			res.redirect('/')
		}
	)
}

export function logout(req: Request, res: Response) {
	strategy.logout(req, (err, url) => {
		if (err) {
			res.sendStatus(500)
		} else {
			res.redirect(url)
		}
	})
}

export function isAuthenticated(
	req: Request,
	res: Response,
	next: NextFunction
) {
	if (req.isAuthenticated()) {
		return next()
	}
	res.redirect('/authenticate')
}

export {passport}
