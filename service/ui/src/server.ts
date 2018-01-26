import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as config from 'config'
import * as express from 'express'
import * as session from 'express-session'
import * as lusca from 'lusca'
import * as passport from 'passport'
import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as passportConfig from 'ui/config/passport'
import * as homeController from 'ui/controllers/home'
import * as searchController from 'ui/controllers/search'
import * as userController from 'ui/controllers/user'
import * as catalog from 'ui/service/catalog'
import * as elko from 'ui/service/elko'

const {PORT = 3001} = process.env

const app = express()
const FileStore = sessionFileStore(session)

app.use(
	session({
		cookie: {
			maxAge: 31536000,
		},
		resave: true,
		saveUninitialized: true,
		secret: config.get('session.secret'),
		store: new FileStore({
			path: process.env.NOW ? `/tmp/sessions` : `.sessions`,
		}),
	})
)

app.enable('trust proxy')

app.use(passport.initialize())
app.use(passport.session())

app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))

app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.log(
			'Error handling request for',
			req.method,
			req.url,
			req.body,
			'\n',
			err.stack
		)
		res.sendStatus(500)
	}
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(compression({threshold: 0}))

app.use(serveStatic('assets'))

app.get('/', homeController.index)
app.get('/sign-in', userController.signIn)
app.get('/sign-out', userController.signOut)
app.get('/reset-password', userController.resetPassword)
app.get('/profile', passportConfig.isAuthenticated, userController.editProfile)
app.post(
	'/profile',
	passportConfig.isAuthenticated,
	userController.tryUpdateProfile
)
app.get(
	'/profile-updated',
	passportConfig.isAuthenticated,
	userController.editProfileComplete
)
app.get('/search', passportConfig.isAuthenticated, searchController.index)

app.all(
	'/authenticate',
	passport.authenticate('saml', {
		failureFlash: true,
		failureRedirect: '/',
	}),
	(req, res) => {
		res.redirect('/')
	}
)

const SCHEMA = `tags: [string] @index(exact) .
title: string @index(fulltext) .
uri: string .
`

async function catalogDemo(req: express.Request, res: express.Response) {
	await catalog.wipe(elko.context())
	await catalog.setSchema(elko.context(), {schema: SCHEMA})
	for (const [title, tags] of Object.entries({
		Alice: ['david', 'jen'],
		Reia: ['alice', 'tav'],
		Zeno: ['alice', 'tav'],
	})) {
		const id = await catalog.add(elko.context(), {
			entry: {tags, title, uri: 'family'},
		})
		console.log('Created:', id)
	}
	const resp = await catalog.search(elko.context(), {
		// after: '0x01',
		first: 1,
		tags: ['alice', 'david', 'tav'],
	})
	res.send(JSON.stringify(resp))
}

app.get('/catalog.demo', (req, res) => {
	catalogDemo(req, res).catch((err: Error) => {
		console.log('Got error with catalog.demo:', err)
	})
})

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`)
})
