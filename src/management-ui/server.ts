import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as express from 'express'
import * as session from 'express-session'
import * as config from 'lib/config'
import * as log4js from 'log4js'
import * as lusca from 'lusca'
import * as path from 'path'

import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as passport from 'lib/config/passport'

import * as bookingsController from './controllers/bookings/index'
import * as displayCourseController from './controllers/course/display'
import * as editCourseController from './controllers/course/edit'
import * as homeController from './controllers/home'
import * as loginController from './controllers/login'

import * as i18n from 'lib/service/translation'

/* tslint:disable:no-var-requires */
const favicon = require('serve-favicon')
const fileUpload = require('express-fileupload')

log4js.configure(config.LOGGING)

const logger = log4js.getLogger('server')

const {PORT = 3003} = process.env

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

app.use(fileUpload())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(compression({threshold: 0}))

app.use(serveStatic('assets'))
app.use(favicon(path.join('assets', 'img', 'favicon.ico')))

passport.configure('lpg-management-ui', config.AUTHENTICATION.serviceUrl, app)
i18n.configure(app)

app.use(passport.isAuthenticated)
app.get('/sign-in', loginController.signIn)
app.get('/sign-out', loginController.signOut)

app.get('/', homeController.index)
app.get('/courses', displayCourseController.index)

app.param('courseId', editCourseController.loadCourse)
app.param('moduleId', editCourseController.loadModule)

app.get('/courses/:courseId/edit', editCourseController.editCourse)
app.post('/courses/:courseId/edit', editCourseController.doEditCourse)
app.get('/courses/:courseId/add-module', editCourseController.addModule)
app.post('/courses/:courseId/add-module', editCourseController.doAddModule)
app.get('/courses/:courseId/:moduleId/edit', editCourseController.editModule)
app.post('/courses/:courseId/:moduleId/edit', editCourseController.doEditModule)

app.get('/courses/:courseId', displayCourseController.displayCourse)

app.get('/bookings', bookingsController.index)

app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		logger.error(
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
	logger.info(`listening on port ${PORT}`)
})
