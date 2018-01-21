import * as bodyParser from 'body-parser'
import * as compression from 'compression'
import * as config from 'config'
import * as express from 'express'
import * as session from 'express-session'
import * as lusca from 'lusca'
import * as passport from 'passport'
import * as serveStatic from 'serve-static'
import * as sessionFileStore from 'session-file-store'
import * as render from 'ui/render'

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
		secret: config.get('session.secret'),
		store: new FileStore({
			path: process.env.NOW ? `/tmp/sessions` : `.sessions`,
		}),
	})
)

app.use(passport.initialize())
app.use(passport.session())

//app.use(lusca.csrf());
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xssProtection(true))

app.use((err, req, res, next) => {
	console.log(
		'Error handling request for',
		req.method,
		req.url,
		req.body,
		'\n',
		err.stack
	)
	res.sendStatus(500)
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.use(compression({threshold: 0}))

app.use(serveStatic('assets'))

const SamlStrategy = require('passport-saml').Strategy

app.get('/sign-in', (req, res) => {
	const sessionDataKey = req.query.sessionDataKey
	const loginFailed = req.query.authFailureMsg === 'login.fail.message'

	if (req.isAuthenticated()) {
		res.redirect('/profile')
	} else if (!sessionDataKey) {
		res.redirect('/authenticate')
	} else {
		res.send(
			render.signIn({
				loginFailed,
				sessionDataKey,
				authenticationServiceUrl: config.get('authentication.serviceUrl'),
			})
		)
	}
})

function configurePassport() {
	passport.use(
		new SamlStrategy(
			{
				acceptedClockSkewMs: -1,
				entryPoint: `${config.get('authentication.serviceUrl')}/samlsso`,
				issuer: 'lpg-ui',
				path: '/authenticate',
			},
			(profile, done) => {
				done(null, {
					department: profile['http://wso2.org/claims/department'],
					emailAddress: profile.nameID,
					grade: profile['http://wso2.org/claims/grade'],
					profession: profile['http://wso2.org/claims/profession'],
				})
			}
		)
	)

	passport.serializeUser((user, done) => {
		done(null, JSON.stringify(user))
	})

	passport.deserializeUser((data, done) => {
		done(null, JSON.parse(data))
	})
}

app.all(
	'/authenticate',
	passport.authenticate('saml', {
		failureRedirect: '/',
		failureFlash: true,
	}),
	(req, res) => {
		res.redirect('/profile')
	}
)

configurePassport()

app.get('/', (req, res) => {
	res.send(render.homepage())
})

app.get('/sign-out', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/')
	})
})

app.get('/profile', (req, res) => {
	if (!req.isAuthenticated()) {
		res.redirect('/sign-in')
	} else {
		res.send(render.profile(req.user))
	}
})

app.get('/search', (req, res) => {
	if (req.session.passport) {
		res.send(render.search(req.session.passport.user))
	} else {
		res.send(render.search())
	}
})

app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`)
})
