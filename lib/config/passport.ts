import {Request, Response, NextFunction} from 'express'
import * as passport from 'passport'
import * as config from 'config'
import {Strategy} from 'passport-saml'

const strategy = new Strategy(
	{
		acceptedClockSkewMs: -1,
		entryPoint: `${config.get('authentication.serviceUrl')}/samlsso`,
		issuer: config.get('authentication.issuer'),
		path: '/authenticate',
	},
	(profile, done) => {
		done(null, {
			department: profile['http://wso2.org/claims/department'],
			emailAddress: profile.nameID,
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

export let logout = (req: Request, res: Response) => {
	strategy.logout(req, (err, url) => {
		if (err) {
			res.sendStatus(500)
		} else {
			res.redirect(url)
		}
	})
}

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
