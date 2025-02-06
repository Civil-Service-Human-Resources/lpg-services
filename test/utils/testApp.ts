import * as express from 'express'
import {Express} from 'express'
import {User} from '../../src/lib/model'
import * as nunjucks from '../../src/lib/ui/middleware/nunjucks'
import * as session from 'express-session'

let app: express.Express = express()

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

	const user = new User('testUid', roles, 'accessToken', 'user@domain.com', '1')
	user.lineManager = {email: 'lmEmail.com', name: 'lmName'}
	req.user = user
	res.locals.user = user
	next()
})

nunjucks.register(app)

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

export const getApp = () => {
	return app
}

export const createSubApp = () => {
	const subApp: express.Express = express()
	return applySessionToApp(subApp)
}
