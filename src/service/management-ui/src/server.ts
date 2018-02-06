import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as express from 'express'
import * as fileUpload from 'express-fileupload'
import * as session from 'express-session'
import * as config from 'lib/config'
import * as lusca from 'lusca'
import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'

import * as homeController from './controllers/home'
import * as displayCourseController from './controllers/course/display'
import * as editCourseController from './controllers/course/edit'
import * as resetCourseController from './controllers/course/reset'

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

app.get('/', homeController.index)
app.get('/courses', displayCourseController.index)
app.get('/courses/add', editCourseController.addCourse)
app.post('/courses/add', editCourseController.doAddCourse)
app.get('/courses/reset', resetCourseController.reset)
app.param('courseId', editCourseController.loadCourse)
app.get('/courses/:courseId/edit', editCourseController.editCourse)
app.post('/courses/:courseId/edit', editCourseController.doEditCourse)
app.get('/courses/:courseId', displayCourseController.displayCourse)

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
