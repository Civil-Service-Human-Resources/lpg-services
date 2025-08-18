import * as express from 'express'
import {Express} from 'express'
import {User} from '../../src/lib/model'
import * as nunjucks from '../../src/lib/ui/middleware/nunjucks'
import * as session from 'express-session'
import * as flash from 'connect-flash'

let app: express.Express = express()
const applySessionToApp = (sessionableApp: Express) => {
	sessionableApp.use(
		session({
			cookie: {
				httpOnly: true,
				secure: false,
			},
			secret: 'secret',
			resave: true,
			saveUninitialized: true,
		})
	)
	return sessionableApp
}

app = applySessionToApp(app)
app.use(flash())

app.use((req, res, next) => {
	let roles: string[] = []
	const roleHeader = req.header('roles')
	if (roleHeader !== undefined) {
		roles = roleHeader.split(',')
	}

	const resLocals = req.header('locals')
	if (resLocals !== undefined) {
		for (const local of resLocals.split(',')) {
			const localKV = local.split(':')
			res.locals[localKV[0]] = localKV[1]
		}
	}

	const flashes = req.header('flashes')
	if (flashes !== undefined) {
		for (const reqFlash of flashes.split(',')) {
			const flashKV = reqFlash.split(':')
			req.flash(flashKV[0].toString().trim(), [flashKV[1].trim()])
		}
	}

	const user = new User('testUid', roles, 'accessToken', 'user@domain.com', '1')
	user.lineManager = {email: 'lmEmail.com', name: 'lmName'}
	req.user = user
	res.locals.user = user
	next()
})

nunjucks.register(app)

export const getApp = () => {
	return app
}

export const createSubApp = () => {
	const subApp: express.Express = express()
	return applySessionToApp(subApp)
}
