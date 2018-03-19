import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as cors from 'cors'
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
import * as model from 'lib/model'
import * as i18n from 'lib/service/translation'

import * as bookingController from './controllers/booking'
import * as courseController from './controllers/course'
import * as feedbackController from './controllers/feedback'
import * as homeController from './controllers/home'
import * as learningRecordController from './controllers/learning-record'
import * as searchController from './controllers/search'
import * as suggestionController from './controllers/suggestion'
import * as userController from './controllers/user'
import * as xApiController from './controllers/xapi'

/* tslint:disable:no-var-requires */
const favicon = require('serve-favicon')

log4js.configure(config.LOGGING)

const {PORT = 3001} = process.env

const logger = log4js.getLogger('server')

const app = express()
const FileStore = sessionFileStore(session)

const corsOptions = {
	allowedHeaders: ['Authorization', 'Content-Type', 'X-Experience-API-Version'],
	credentials: true,
	origin: /\.cshr\.digital$/,
}
app.options('*', cors(corsOptions))

app.use(
	session({
		cookie: {
			domain: '.cshr.digital',
            httpOnly: false,
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
app.use(favicon(path.join('assets', 'img', 'favicon.ico')))

passport.configure('lpg-ui', config.AUTHENTICATION.serviceUrl, app)
i18n.configure(app)

app.get('/', homeController.index)
app.get('/sign-in', userController.signIn)
app.get('/sign-out', userController.signOut)
app.get('/reset-password', userController.resetPassword)

app.post('/feedback.record', asyncHandler(feedbackController.record))

app.use(passport.isAuthenticated)
app.use(passport.hasRole('learner'))

app.get('/api/lrs.record', asyncHandler(learningRecordController.record))

app.get('/profile', userController.viewProfile)

app.get('/profile/:profileDetail', userController.renderEditPage)
app.post('/profile/:profileDetail', userController.tryUpdateProfile)
app.get('/profile-updated', userController.editProfileComplete)

app.use(
	(req: express.Request, res: express.Response, next: express.NextFunction) => {
		const user = req.user as model.User
		if (!user.hasCompleteProfile()) {
			logger.debug('Incomplete profile, redirecting user')
			res.redirect('/profile')
		} else {
			next()
		}
	}
)

app.param('courseId', asyncHandler(courseController.loadCourse))
app.param('moduleId', asyncHandler(courseController.loadModule))
app.param('eventId', asyncHandler(courseController.loadEvent))

app.get('/courses/:courseId', asyncHandler(courseController.display))
app.use(
	'/courses/:courseId/delete',
	asyncHandler(courseController.markCourseDeleted)
)
app.use('/courses/:courseId/:moduleId/xapi', asyncHandler(xApiController.proxy))
app.use(
    '/courses/:courseId/:moduleId',
    asyncHandler(courseController.displayModule)
)

app.get('/learning-record', asyncHandler(learningRecordController.display))
app.get(
	'/learning-record/:courseId',
	asyncHandler(learningRecordController.courseResult)
)

app.get('/search', asyncHandler(searchController.search))
app.get(
	'/suggestions-for-you',
	asyncHandler(suggestionController.suggestionsPage)
)
app.get(
	'/suggestions-for-you/:expandedAow',
	asyncHandler(suggestionController.expandedSuggestionsPage)
)
app.get(
	'/suggestions-for-you/add/:courseId',
	asyncHandler(suggestionController.addToPlan)
)
app.get(
	'/suggestions-for-you/remove/:courseId',
	asyncHandler(suggestionController.removeFromSuggestions)
)

app.get('/home', asyncHandler(homeController.home))

app.get(
	'/book/:courseId/:moduleId/choose-date',
	bookingController.renderChooseDate
)
app.post(
	'/book/:courseId/:moduleId/choose-date',
	bookingController.selectedDate
)

app.get(
	'/book/:courseId/:moduleId/:eventId',
	bookingController.renderPaymentOptions
)
app.post(
	'/book/:courseId/:moduleId/:eventId',
	bookingController.enteredPaymentDetails
)

app.get(
	'/book/:courseId/:moduleId/:eventId/confirm',
	asyncHandler(bookingController.renderConfirmPayment)
)

app.get(
	'/book/:courseId/:moduleId/:eventId/complete',
	asyncHandler(bookingController.tryCompleteBooking)
)

app.get(
	'/book/:courseId/:moduleId/:eventId/cancel',
	asyncHandler(bookingController.renderCancelBookingPage)
)
app.post(
	'/book/:courseId/:moduleId/:eventId/cancel',
	asyncHandler(bookingController.tryCancelBooking)
)

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
