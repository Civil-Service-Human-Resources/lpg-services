import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as config from 'config'
import * as express from 'express'
import * as session from 'express-session'
import * as lusca from 'lusca'
import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as homeController from 'management-ui/controllers/home'
import * as courseController from 'management-ui/controllers/course'

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
		secret: config.get('session.secret'),
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

app.get('/', homeController.index)
app.get('/courses', courseController.index)
app.get('/courses/add', courseController.editCourse)
app.post('/courses/add', courseController.doEditCourse)
app.get('/courses/reset', courseController.resetCourses)
app.get('/courses/:courseId/edit', courseController.editCourse)
app.post('/courses/:courseId/edit', courseController.doEditCourse)
app.get('/courses/:courseId', courseController.displayCourse)

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
