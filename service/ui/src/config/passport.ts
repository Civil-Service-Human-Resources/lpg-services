import {Request, Response, NextFunction} from 'express'
import * as passport from 'passport'
import * as config from 'config'
import {Strategy} from 'passport-saml'

passport.use(
	new Strategy(
		{
			acceptedClockSkewMs: -1,
			entryPoint: `${config.get('authentication.serviceUrl')}/samlsso`,
			issuer: 'lpg-ui',
			path: '/authenticate',
		},
		(profile, done) => {
			done(null, {
				department: profile['http://wso2.org/claims/department'],
				emailAddress: profile.nameID,
				grade: profile['http://wso2.org/claims/grade'],
				profession: profile['http://wso2.org/claims/profession'],
			})
		}
	)
)

passport.serializeUser((user, done) => {
	done(null, JSON.stringify(user))
})

passport.deserializeUser((data, done) => {
	done(null, JSON.parse(data))
})

export let isAuthenticated = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	if (req.isAuthenticated()) {
		return next()
	}
	res.redirect('/sign-in')
}
