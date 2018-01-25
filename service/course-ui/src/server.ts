import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as config from 'config'
import * as express from 'express'
import * as session from 'express-session'
import * as lusca from 'lusca'
import * as passport from 'passport'
import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as playerController from 'course-ui/controllers/player'
import * as xApiController from 'course-ui/controllers/xapi'

import * as passportConfig from 'course-ui/config/passport'

const {PORT = 3002} = process.env

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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(compression({threshold: 0}))

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

app.use(passportConfig.isAuthenticated)

app.get(/.*portal_overrides\.js/, playerController.portalOverrides)
app.all(/^\/xapi\/.+/, xApiController.proxy)

app.use(serveStatic('assets'))
app.use(serveStatic('tmp-courses', {index: ['index.html', 'index.htm']}))

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

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`)
})
