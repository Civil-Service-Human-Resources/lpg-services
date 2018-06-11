import * as config from 'lib/config'
import * as log4js from 'log4js'

log4js.configure(config.LOGGING)

import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as express from 'express'
import * as asyncHandler from 'express-async-handler'
import * as session from 'express-session'
import * as fs from 'fs'
import * as helmet from 'helmet'
import * as path from 'path'

import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as passport from 'lib/config/passport'
import * as i18n from 'lib/service/translation'

import * as audienceController from './controllers/audience/index'
import * as bookingsController from './controllers/bookings/index'
import * as displayCourseController from './controllers/course/display'
import * as editCourseController from './controllers/course/edit'
import * as homeController from './controllers/home'
import * as editModuleController from './controllers/module/edit'
import * as reportsController from './controllers/reports'

import * as loginController from './controllers/login'

import * as expressValidator from 'express-validator'

/* tslint:disable:no-var-requires */
const flash = require('connect-flash')
const favicon = require('serve-favicon')
const fileUpload = require('express-fileupload')
/* tslint:enable */

const logger = log4js.getLogger('server')

const {PORT = 3003} = process.env

const app = express()
const FileStore = sessionFileStore(session)

app.use(
	session({
		cookie: {
			httpOnly: true,
			maxAge: 31536000,
			secure: config.PRODUCTION_ENV,
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

app.use(helmet())

app.use(flash())
app.use(fileUpload())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(compression({threshold: 0}))

app.use(serveStatic('assets'))
app.use(favicon(path.join('assets', 'img', 'favicon.ico')))

app.get('/status', (req, res) => {
	let version = 'unknown'
	try {
		version = fs.readFileSync('../../VERSION.txt').toString()
	} catch (e) {
		logger.debug('No version set')
	}
	res.send({
		version,
	})
})

passport.configure(
	config.AUTHENTICATION.managementId,
	config.AUTHENTICATION.managementSecret,
	config.AUTHENTICATION.serviceUrl,
	app,
	config.LPG_MANAGMENT_SERVER
)
i18n.configure(app)

app.use(passport.isAuthenticated)
app.use('/courses', passport.hasRole('COURSE_MANAGER'))
app.use('/reports', passport.hasAnyRole(['ORGANISATION_REPORTER', 'PROFESSION_REPORTER', 'CSHR_REPORTER']))

app.use(expressValidator())

app.post(
	'*',
	(req: express.Request, res: express.Response, next: express.NextFunction) => {
		for (const key of Object.keys(req.body)) {
			if (!Array.isArray(req.body[key])) {
				req.sanitizeBody(key).escape()
			}
		}
		next()
	}
)

app.get('/sign-in', loginController.signIn)
app.get('/sign-out', loginController.signOut)

app.get('/', homeController.index)

app.get('/reports', reportsController.index)
app.get('/reports/learner-record', reportsController.runLearnerRecordReport)

app.get('/courses', asyncHandler(displayCourseController.index))

app.param('courseId', asyncHandler(editCourseController.loadCourseStub))
app.param('moduleId', asyncHandler(editModuleController.loadModule))

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
app.get('/bookings', asyncHandler(bookingsController.index))

app.get('/courses/:courseId', displayCourseController.displayCourse)

app.get('/search/create', displayCourseController.loadSearch)

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
