/* tslint:disable:no-var-requires */
const appInsights = require('applicationinsights')
import * as config from 'lib/config'

appInsights
.setup(config.INSTRUMENTATION_KEY)
.setAutoDependencyCorrelation(true)
.setAutoCollectRequests(true)
.setAutoCollectPerformance(true)
.setAutoCollectExceptions(true)
.setAutoCollectDependencies(true)
.setAutoCollectConsole(true)
.setUseDiskRetryCaching(true)
.start()

/* tslint:enable */

import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as connectRedis from 'connect-redis'
import * as cors from 'cors'
import * as express from 'express'
import * as asyncHandler from 'express-async-handler'
import * as session from 'express-session'
import * as fs from 'fs'
import * as log4js from 'log4js'
import * as redis from 'redis'
import { URL } from 'url'

import * as lusca from 'lusca'
import * as serveStatic from 'serve-static'

import * as corsConfig from 'lib/config/corsConfig'
import * as luscaConfig from 'lib/config/luscaConfig'
import * as passport from 'lib/config/passport'
import * as i18n from 'lib/service/translation'
import {ProfileChecker} from 'lib/ui/profileChecker'
import * as template from 'lib/ui/template'

import * as bookingRouter from './controllers/booking/routes'
import * as courseController from './controllers/course'
import * as feedbackController from './controllers/feedback'
import * as homeController from './controllers/home'
import * as learningRecordController from './controllers/learning-record'
import * as learningRecordFeedbackController from './controllers/learning-record/feedback'
import * as profileController from './controllers/profile'
import * as searchController from './controllers/search'
import * as skillsController from './controllers/skills'
import * as suggestionController from './controllers/suggestion'
import * as userController from './controllers/user'
import * as xApiController from './controllers/xapi'

import * as errorController from './controllers/errorHandler'

log4js.configure(config.LOGGING)

/* tslint:disable:no-var-requires */
const flash = require('connect-flash')
/* tslint:enable */

const {PORT = 3001} = process.env

const logger = log4js.getLogger('server')

const app = express()

app.disable('x-powered-by')
app.disable('etag')
app.enable('trust proxy')

const corsOptions = corsConfig.setCorsOptions()
app.use(cors(corsOptions))

app.use(
	log4js.connectLogger(logger, {
		format: ':method :url',
		level: 'trace',
		nolog: '\\.js|\\.css|\\.gif|\\.jpg|\\.png|\\.ico$',
	})
)

const RedisStore = connectRedis(session)
const redisClient = redis.createClient({
	auth_pass: config.REDIS.password,
	host: config.REDIS.host,
	no_ready_check: true,
	port: config.REDIS.port,
})
app.use(
	session({
		cookie: {
			httpOnly: true,
			maxAge: config.COOKIE.maxAge,
			secure: config.PRODUCTION_ENV,
		},
		name: 'lpg-ui',
		resave: true,
		saveUninitialized: true,
		secret: config.SESSION_SECRET,
		store: new RedisStore({
			client: redisClient,
		}),
	})
)
app.use(flash())

app.use(bodyParser.json({strict: false}))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.text())

app.use(compression({threshold: 0}))

app.locals.staticAssetDomain = ''
app.locals.staticAssetRoot = ''

if (config.STATIC_ASSET_ROOT) {
	try {
		const staticAssetUrl = new URL(config.STATIC_ASSET_ROOT)

		app.locals.staticAssetDomain = staticAssetUrl.hostname
		app.locals.staticAssetRoot = config.STATIC_ASSET_ROOT

		if (staticAssetUrl.protocol !== "https:") {
			logger.warn(`Static assets are not being served over ssl (static asset route: ${app.locals.staticAssetRoot})`)
		}

	} catch (error) {
		// tslint:disable-next-line:max-line-length
		logger.error(`The configured STATIC_ASSET_ROOT value ("${config.STATIC_ASSET_ROOT}") is not a valid URL, static content will default to being severed from the application server.\nFull error:\n${error}`)
	}
}

app.use(serveStatic('assets', { maxAge: config.STATIC_ASSET_TTL }))

const luscaPolicy = luscaConfig.setCspPolicy(app.locals.staticAssetDomain)

app.use(
		lusca({
			csp: {
				policy: luscaPolicy,
			},
			hsts: {maxAge: config.ONE_YEAR_IN_SECONDS, includeSubDomains: true, preload: true},
			nosniff: true,
			referrerPolicy: 'same-origin',
			xframe: 'SAMEORIGIN',
			xssProtection: true,
		})
)

passport.configure(
	config.AUTHENTICATION.clientId,
	config.AUTHENTICATION.clientSecret,
	config.AUTHENTICATION.serviceUrl,
	app,
	config.LPG_UI_SERVER
)
i18n.configure(app)

app.param('courseId', asyncHandler(courseController.loadCourse))
app.param('moduleId', asyncHandler(courseController.loadModule))
app.param('eventId', asyncHandler(courseController.loadEvent))

app.use('/courses/:proxyCourseId/:proxyModuleId/xapi', asyncHandler(xApiController.proxy))

/**
 * The below handler is added as there are xapi calls done against learning-record which were not handled and were
 * caught by lusca CSRF check - resulting with big number of error messages.
 *
 * As it hit 100% error rate the below handler is proposed to remediate the errors appearing - it is to be
 * investigated whether the calls should be handled (or could they be removed completely).
 */
app.use('/learning-record/:learnerRecordId/:notHandledModuleId/xapi',
	(req: express.Request, res: express.Response) => res.sendStatus(204))

app.use(lusca.csrf())

app.get('/', homeController.index)
app.get('/sign-in', userController.signIn)
app.get('/sign-out', asyncHandler(userController.signOut))
app.get('/reset-password', userController.resetPassword)

app.get('/privacy', (req, res) => {
	res.send(template.render('privacy', req, res))
})

app.get('/accessibility-statement', (req, res) => {
	res.send(template.render('accessibility-statement', req, res))
})

app.get('/cookies', homeController.cookies)

app.get('/contact-us', homeController.contactUs)

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

app.post('/feedback.record', asyncHandler(feedbackController.record))

app.use(passport.isAuthenticated)
app.use(passport.hasRole('LEARNER'))

//if (config.PROFILE !== 'local') {
	app.use(new ProfileChecker().checkProfile())
//}

app.get('/api/lrs.record', asyncHandler(learningRecordController.record))

app.get('/profile', userController.viewProfile)

app.get('/profile/name', profileController.addName)
app.post('/profile/name', asyncHandler(profileController.updateName))
app.get('/profile/organisation', asyncHandler(profileController.addOrganisation))
app.post('/profile/organisation', asyncHandler(profileController.updateOrganisation))
app.get('/profile/profession', asyncHandler(profileController.addProfession))
app.post('/profile/profession', asyncHandler(profileController.updateProfession))
app.get('/profile/otherAreasOfWork', asyncHandler(profileController.addOtherAreasOfWork))
app.post('/profile/otherAreasOfWork', asyncHandler(profileController.updateOtherAreasOfWork))
app.get('/profile/interests', asyncHandler(profileController.addInterests))
app.post('/profile/interests', asyncHandler(profileController.updateInterests))
app.get('/profile/grade', asyncHandler(profileController.addGrade))
app.post('/profile/grade', asyncHandler(profileController.updateGrade))
app.get('/profile/lineManager', profileController.addLineManager)
app.post('/profile/lineManager', asyncHandler(profileController.updateLineManager))
app.get('/profile/email', profileController.addEmail)
app.post('/profile/email', asyncHandler(profileController.updateEmail))

app.get('/profile/:profileDetail', asyncHandler(userController.renderEditPage))
app.post('/profile/:profileDetail', asyncHandler(userController.tryUpdateProfile))

app.get('/courses/:courseId', asyncHandler(courseController.display))

app.use(
	'/courses/:courseId/delete',
	asyncHandler(courseController.markCourseDeleted)
)

app.use(
	'/courses/:courseId/:moduleId',
	asyncHandler(courseController.displayModule)
)

app.get('/learning-record', asyncHandler(learningRecordController.display))
app.get(
	'/learning-record/feedback',
	asyncHandler(learningRecordFeedbackController.listItemsForFeedback)
)

app.get(
	'/learning-record/:courseId/:moduleId/feedback',
	asyncHandler(learningRecordFeedbackController.displayFeedback)
)
app.post(
	'/learning-record/:courseId/:moduleId/feedback',
	asyncHandler(learningRecordFeedbackController.submitFeedback)
)

app.get(
	'/learning-record/:courseId/:moduleId',
	asyncHandler(learningRecordController.courseResult)
)

app.get('/search', asyncHandler(searchController.search))
app.get(
	'/suggestions-for-you',
	asyncHandler(suggestionController.suggestionsPage)
)
app.get(
	'/suggestions-for-you/add/:courseId',
	asyncHandler(suggestionController.addToPlan)
)
app.get(
	'/suggestions-for-you/remove/:courseId',
	asyncHandler(suggestionController.removeFromSuggestions)
)

app.get('/skills', asyncHandler(skillsController.introduction))
app.get('/skills/choose-quiz', asyncHandler(skillsController.chooseQuiz))
app.post('/skills/start-quiz', asyncHandler(skillsController.startQuiz))
app.get('/skills/questions/:questionIndex', asyncHandler(skillsController.displayQuestion))
app.post('/skills/questions/:questionIndex', asyncHandler(skillsController.answerQuestion))
app.get('/skills/summary/:answerSubmissionId', asyncHandler(skillsController.quizSummary))
app.get('/skills/quiz-history', asyncHandler(skillsController.quizHistory))

app.get('/home', asyncHandler(homeController.home))

app.use(bookingRouter.router)

app.use(errorController.handleError)

if (require.main === module) {
	const server = app.listen(PORT, () => {
		logger.info(`listening on port ${PORT}`)
	})
	server.setTimeout(config.SERVER_TIMEOUT_MS)
}

module.exports = app
