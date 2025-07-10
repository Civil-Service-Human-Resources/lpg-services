/* eslint-disable typescript-eslint/no-var-requires */
export const appInsights = require('applicationinsights')
/* eslint-enable */
import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as connectRedis from 'connect-redis'
import * as cors from 'cors'
import * as express from 'express'
import * as asyncHandler from 'express-async-handler'
import * as session from 'express-session'
import {AUTHENTICATION, BACKEND_SERVER_PATH, STATIC_DIR} from './lib/config'
import * as config from './lib/config'
import * as corsConfig from './lib/config/corsConfig'
import * as luscaConfig from './lib/config/luscaConfig'
import * as passport from './lib/config/passport'
import {configureAPI} from './lib/config/passport-backend'
import {getLogger} from './lib/logger'
import {logoutUser} from './lib/service/api/cache/cacheService'
import {AreasOfWork} from './lib/service/civilServantRegistry/areaOfWork/areasOfWork'
import {ProfileCache} from './lib/service/civilServantRegistry/civilServant/profileCache'
import * as csrsService from './lib/service/civilServantRegistry/csrsService'
import {Grades} from './lib/service/civilServantRegistry/grade/grades'
import {Interests} from './lib/service/civilServantRegistry/interest/interests'
import {OrganisationalUnitCache} from './lib/service/civilServantRegistry/organisationalUnit/organisationalUnitCache'
import {OrganisationalUnitTypeaheadCache} from './lib/service/civilServantRegistry/organisationalUnit/organisationalUnitTypeaheadCache'
import {LearningRecordCache} from './lib/service/cslService/cache/learningRecordCache'
import {RequiredLearningCache} from './lib/service/cslService/cache/RequiredLearningCache'
import * as cslService from './lib/service/cslService/cslServiceClient'
import * as dynamicBackLink from './lib/ui/middleware/dynamicBackLink'
import * as nunjucks from './lib/ui/middleware/nunjucks'
import * as redirectTo from './lib/ui/middleware/redirectTo'
import * as profileChecker from './lib/ui/profileChecker'
import * as lusca from 'lusca'
import * as serveStatic from 'serve-static'
import {URL} from 'url'
import {requiresDepartmentHierarchy} from './lib/ui/requiresDepartmentHierarchy'
import * as template from './lib/ui/template'
import {AnonymousCache} from './lib/utils/anonymousCache'
import {redisClient} from './lib/utils/redis'
import * as bookingRouter from './ui/controllers/booking/routes'
import * as courseController from './ui/controllers/course'
import * as errorController from './ui/controllers/errorHandler'
import * as homeController from './ui/controllers/home'
import * as learningRecordController from './ui/controllers/learning-record'
import {getGETProfileMiddleware, getPOSTProfileMiddleware} from './ui/controllers/profile'
import * as profileController from './ui/controllers/profile'
import {ProfileEndpoint} from './ui/controllers/profile/pages/common'
import * as searchController from './ui/controllers/search'
import * as skillsController from './ui/controllers/skills'
import * as suggestionController from './ui/controllers/suggestion'
import {completeVideoModule} from './ui/controllers/video'

export let appInsightsStarted = false

if (config.APPLICATIONINSIGHTS_CONNECTION_STRING) {
	appInsights.setup(config.APPLICATIONINSIGHTS_CONNECTION_STRING).setAutoCollectConsole(true)
	appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'lpg-ui'
	appInsights.start()
	appInsightsStarted = true
}

const backendServerPath = `/${BACKEND_SERVER_PATH}`

/* eslint-disable typescript-eslint/no-var-requires */
const flash = require('connect-flash')
/* eslint-enable */

const {PORT = 3001} = process.env

const logger = getLogger('server.ts')

const app = express()

const backendRouter = express.Router()

configureAPI(AUTHENTICATION.jwtKey, backendRouter)
backendRouter.post('/caches/user/:uid/logout', asyncHandler(logoutUser))
app.use(backendServerPath, backendRouter)

app.disable('x-powered-by')
app.disable('etag')
app.enable('trust proxy')

const corsOptions = corsConfig.setCorsOptions()
app.use(cors(corsOptions))

// Caches

const RedisStore = connectRedis(session)
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

const orgCache = new OrganisationalUnitCache(redisClient, config.ORG_REDIS.defaultTTL)
const orgTypeaheadCache = new OrganisationalUnitTypeaheadCache(redisClient, config.ORG_REDIS.defaultTTL)
const csrsProfileCache = new ProfileCache(redisClient, config.PROFILE_REDIS.defaultTTL)
const gradeCache = new AnonymousCache(redisClient, config.GRADE_REDIS.defaultTTL, 'grades', Grades)
const areaOfWorkCache = new AnonymousCache(redisClient, config.AOW_REDIS.defaultTTL, 'areasOfWork', AreasOfWork)
const interestCache = new AnonymousCache(redisClient, config.INTEREST_REDIS.defaultTTL, 'Interests', Interests)
csrsService.setCaches(orgCache, orgTypeaheadCache, csrsProfileCache, gradeCache, areaOfWorkCache, interestCache)

const learningRecordCache = new LearningRecordCache(redisClient, config.ENDPOINT_REDIS.LEARNING_RECORD.defaultTTL)
const requiredLearningCache = new RequiredLearningCache(redisClient, config.ENDPOINT_REDIS.REQUIRED_LEARNING.defaultTTL)
cslService.setCaches(learningRecordCache, requiredLearningCache)

app.use(flash())

app.use(bodyParser.json({strict: false}))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.text())

app.use(compression({threshold: 0}))

app.locals.staticAssetDomain = ''
app.locals.staticAssetRoot = ''

app.locals.feedbackDomain = ''
app.locals.feedbackRoot = ''

if (config.FEEDBACK_URL) {
	try {
		const feedbackURL = new URL(config.FEEDBACK_URL)

		app.locals.feedbackDomain = feedbackURL.hostname
		app.locals.feedbackRoot = config.FEEDBACK_URL

		if (feedbackURL.protocol !== 'https:') {
			logger.warn(`Feedback url is not being served over ssl (feedback route: ${app.locals.feedbackRoot})`)
		}
	} catch (error) {
		logger.error(
			`The configured FEEDBACK_URL value ("${config.FEEDBACK_URL}") is not a valid URL. Feedback will not be available.\nFull error:\n${error}`
		)
	}
}

if (config.STATIC_ASSET_ROOT) {
	try {
		const staticAssetUrl = new URL(config.STATIC_ASSET_ROOT)

		app.locals.staticAssetDomain = staticAssetUrl.hostname
		app.locals.staticAssetRoot = config.STATIC_ASSET_ROOT

		if (staticAssetUrl.protocol !== 'https:') {
			logger.warn(`Static assets are not being served over ssl (static asset route: ${app.locals.staticAssetRoot})`)
		}
	} catch (error) {
		logger.error(
			`The configured STATIC_ASSET_ROOT value ("${config.STATIC_ASSET_ROOT}") is not a valid URL, static content will default to being severed from the application server.\nFull error:\n${error}`
		)
	}
}

const staticAssetPath = `${STATIC_DIR}/assets`
logger.debug(`Registering static assets at ${staticAssetPath}`)
app.use(serveStatic(staticAssetPath, {maxAge: config.STATIC_ASSET_TTL, etag: false, acceptRanges: false}))

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
	`${config.AUTHENTICATION.serviceUrl}${config.AUTHENTICATION.endpoints.authorization}`,
	`${config.AUTHENTICATION.serviceUrl}${config.AUTHENTICATION.endpoints.token}`,
	app,
	`${config.LPG_UI_SERVER}/authenticate`
)
nunjucks.register(app)

app.param('courseId', asyncHandler(requiresDepartmentHierarchy))

app.get('/', homeController.index)
app.get('/sign-out', asyncHandler(passport.logout))

app.get('/privacy', (req, res) => {
	res.send(template.render('privacy', req, res))
})

app.get('/accessibility-statement', (req, res) => {
	res.send(
		template.render('accessibility-statement', req, res, {
			contactEmail: config.CONTACT_EMAIL,
		})
	)
})

app.get('/cookies', homeController.cookies)

app.get('/contact-us', homeController.contactUs)

app.use(passport.isAuthenticated)

app.use(asyncHandler(passport.logOutMiddleware))
app.use(passport.hasRole('LEARNER'))

const csrf = lusca.csrf()

app.use((req, res, next) => {
	if (!req.url.startsWith(backendServerPath)) {
		csrf(req, res, next)
	}
})

profileChecker.register(app)
dynamicBackLink.register(app)
redirectTo.registerGET(app)

app.get('/js/video/complete', asyncHandler(completeVideoModule))

app.get('/profile', profileController.viewProfile)

app.get('/profile/email', profileController.addEmail)
app.post('/profile/email', asyncHandler(profileController.updateEmail))

Object.values(ProfileEndpoint).forEach(profileEndpoint => {
	const endpoint = `/profile/${profileEndpoint.valueOf()}`
	logger.info(`Registering endpoint ${endpoint}`)
	app.get(
		endpoint,
		asyncHandler(async (req: express.Request, res: express.Response) => {
			const middleware = await getGETProfileMiddleware(req, profileEndpoint as ProfileEndpoint)
			await middleware(req, res)
		})
	)

	app.post(
		endpoint,
		asyncHandler(async (req: express.Request, res: express.Response) => {
			const middleware = await getPOSTProfileMiddleware(req, profileEndpoint as ProfileEndpoint)
			await middleware(req, res)
		})
	)
})

app.get('/courses/:courseId', asyncHandler(courseController.loadCourse), asyncHandler(courseController.display))

app.use('/courses/:courseId/delete', asyncHandler(courseController.markCourseDeleted))

app.use(
	'/courses/:courseId/:moduleId',
	asyncHandler(courseController.loadCourse),
	asyncHandler(courseController.loadModule),
	asyncHandler(courseController.displayModule)
)

app.get('/learning-record', asyncHandler(requiresDepartmentHierarchy), asyncHandler(learningRecordController.display))

app.get(
	'/learning-record/:courseId/:moduleId',
	asyncHandler(courseController.loadCourse),
	asyncHandler(courseController.loadModule),
	asyncHandler(learningRecordController.courseResult)
)

app.get('/search', asyncHandler(searchController.search))
app.get(
	'/suggestions-for-you',
	asyncHandler(requiresDepartmentHierarchy),
	asyncHandler(suggestionController.suggestionsPage)
)
app.get('/suggestions-for-you/add/:courseId', asyncHandler(suggestionController.addToPlan))
app.get('/suggestions-for-you/remove/:courseId', asyncHandler(suggestionController.removeFromSuggestions))

app.get('/skills', asyncHandler(skillsController.introduction))
app.get('/skills/choose-quiz', asyncHandler(skillsController.chooseQuiz))
app.post('/skills/start-quiz', asyncHandler(skillsController.startQuiz))
app.get('/skills/questions/:questionIndex', asyncHandler(skillsController.displayQuestion))
app.post('/skills/questions/:questionIndex', asyncHandler(skillsController.answerQuestion))
app.get('/skills/summary/:answerSubmissionId', asyncHandler(skillsController.quizSummary))
app.get('/skills/quiz-history', asyncHandler(skillsController.quizHistory))

app.get('/home', asyncHandler(requiresDepartmentHierarchy), asyncHandler(homeController.home))

app.use('/book', bookingRouter.router)

redirectTo.registerPOST(app)

app.use(errorController.handleError)

if (require.main === module) {
	const server = app.listen(PORT, () => {
		logger.info(`listening on port ${PORT}`)
	})
	server.setTimeout(config.SERVER_TIMEOUT_MS)
}

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (req.originalUrl.includes('favicon.ico')) {
		res.status(204).end()
	}
	next()
})

module.exports = app
