import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as express from 'express'
import * as asyncHandler from 'express-async-handler'
import * as session from 'express-session'
import * as config from 'lib/config'
import * as log4js from 'log4js'
import * as lusca from 'lusca'
import * as path from 'path'

import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as passport from 'lib/config/passport'

import * as audienceController from './controllers/audience/index'
import * as bookingsController from './controllers/bookings/index'
import * as displayCourseController from './controllers/course/display'
import * as editCourseController from './controllers/course/edit'
import * as homeController from './controllers/home'
import * as editModuleController from './controllers/module/edit'

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
		name: 'lpg-management-ui',
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
app.use(passport.hasRole('management'))

app.get('/sign-in', loginController.signIn)
app.get('/sign-out', loginController.signOut)

app.get('/', homeController.index)
app.get('/courses', asyncHandler(displayCourseController.index))

app.param('courseId', asyncHandler(editCourseController.loadCourseStub))
app.param('moduleId', asyncHandler(editModuleController.loadModule))

// *** new stuff **

app.get('/courses/:courseId/add-module', editModuleController.getModuleType)
app.post('/courses/:courseId/add-module', editModuleController.setModuleType)

app.get('/courses/:courseId/:moduleId/edit', editModuleController.getModule)
app.post('/courses/:courseId/:moduleId/edit', editModuleController.setModule)

app.get(
	'/courses/:courseId/:moduleId/remove',
	editModuleController.removeModule
)

app.get(
	'/courses/:courseId/:moduleId/:moduleType',
	editModuleController.getModule
)

app.post(
	'/courses/:courseId/:moduleId/:moduleType',
	editModuleController.setModule
)

app.get(
	'/courses/:courseId/:moduleId/audience/:audienceNumber/:profileDetail',
	audienceController.getAudienceNode
)

app.post(
	'/courses/:courseId/:moduleId/audience/:audienceNumber/:profileDetail',
	audienceController.setAudienceNode
)

app.post('/audience/:profileDetail', audienceController.setAudienceNode)

app.get('/courses/:courseId/:moduleId', editModuleController.getModule)
app.post('/courses/:courseId/:moduleId', editModuleController.setModule)
app.get('/courses/:courseId', editCourseController.getCourse)
app.post('/courses/:courseId', editCourseController.setCourse)
// end new

app.get('/bookings', asyncHandler(bookingsController.index))

//** end new stuff */

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
