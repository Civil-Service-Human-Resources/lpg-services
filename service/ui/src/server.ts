import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as express from 'express'
import * as session from 'express-session'
import * as config from 'lib/config'
import * as lusca from 'lusca'
import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as passport from 'lib/config/passport'
import * as i18n from 'lib/service/translation'

import * as homeController from 'ui/controllers/home'
import * as searchController from 'ui/controllers/search'
import * as userController from 'ui/controllers/user'
import * as xApiController from 'ui/controllers/xapi'

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
		secret: config.SESSION_SECRET,
		store: new FileStore({
			path: process.env.NOW ? `/tmp/sessions` : `.sessions`,
		}),
	})
)

app.enable('trust proxy')

app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(compression({threshold: 0}))

app.use(serveStatic('assets'))

passport.configure('lpg-ui', config.AUTHENTICATION.serviceUrl, app)

app.get('/', homeController.index)
app.get('/sign-in', userController.signIn)
app.get('/sign-out', userController.signOut)
app.get('/reset-password', userController.resetPassword)
app.get('/profile', passport.isAuthenticated, userController.editProfile)
app.post('/profile', passport.isAuthenticated, userController.tryUpdateProfile)
app.get(
	'/profile-updated',
	passport.isAuthenticated,
	userController.editProfileComplete
)

i18n.configure(app)

app.get('/learning-plan', searchController.listAllCourses)

app.all(/^\/xapi\/.+/, passport.isAuthenticated, xApiController.proxy)

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
