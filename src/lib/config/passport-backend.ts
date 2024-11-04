import * as express from 'express'
import * as passport from 'passport'
import {ExtractJwt, Strategy} from 'passport-jwt'

export function configureAPI(jwtKey: string, app: express.Router) {
	const passportApi = new passport.Passport()
	app.use(passportApi.initialize())
	const jwtStrategy = new Strategy({
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		secretOrKey: jwtKey,
	}, (jwtPayload: any, done) => {
		return done(null, jwtPayload)
	})

	passportApi.use(jwtStrategy)

	app.all('*', passportApi.authenticate('jwt', {session: false}), (req, res, next) => {
		next()
	})
}
