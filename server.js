const passport = require('passport');
const lusca = require('lusca');
const config = require('config');
const path = require('path');
const app = require('express')();
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session);
const sapper = require('sapper');
const static = require('serve-static');
const flash = require('connect-flash');
require('svelte');
require('svelte/ssr/register');


const { PORT = 3001 } = process.env;

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {

    console.log('URL: ' + req.url);
    console.log('Query: ' + req.query);
    console.log('Body: ' + req.body);

   next();
});


// this allows us to do e.g. `fetch('/api/blog')` on the server
const fetch = require('node-fetch');
global.fetch = (url, opts) => {
	if (url[0] === '/') url = `http://localhost:${PORT}${url}`;
	return fetch(url, opts);
};

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.get('session.secret'),
	cookie: {
		maxAge: 31536000
	},
	store: new FileStore({
		path: process.env.NOW ? `/tmp/sessions` : `.sessions`
	})
}));


//app.use(lusca.csrf());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));


app.use((err, req, res, next) => {
    console.log('Error handling request for', req.method, req.url, req.body, '\n', err.stack);
    res.sendStatus(500);
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(compression({ threshold: 0 }));

app.use(static('assets'));

const SamlStrategy = require('passport-saml').Strategy;



function displaySignin(req, res) {

    let sessionDataKey = req.query.sessionDataKey;

    if (req.user) {
        res.redirect('/');
    } else if (!sessionDataKey) {
        res.redirect('/authenticate');
    } else {
        res.redirect('/sign-in');

    }
}

function doSignOut(req, res) {
    console.log('Signing user out');
    req.session.destroy(() => {
        res.redirect('/');
    });
}

function isAuthenticated(req, res, next) {
    if (!req.user) {
        _forbidden(req, res);
    } else {
        next();
    }
}

function _forbidden(req, res) {
    if (!req.accepts('html')) {
        res.sendStatus(403);
    } else {
        req.session.originalRequestUrl = req.url;
        res.redirect('/sign-in');
    }
}

app.get('/sign-in', (req, res, next) => {
    let sessionDataKey = req.query.sessionDataKey;
    const login = require('./routes/sign-in/index.html');
    console.log(login);

    const rendered = login.render({sessionDataKey: sessionDataKey});
    res.send(rendered.html);

    console.log(res.body);


    next();
});

function configurePassport() {

    passport.use(new SamlStrategy({
            path: '/authenticate',
            entryPoint: 'https://localhost:9443/samlsso',
            issuer: 'lpg-ui',
            acceptedClockSkewMs: -1
        },
        (profile, done) => {
            done(null, {
                emailAddress: profile.nameID,
                department: profile['http://wso2.org/claims/department'],
                profession: profile['http://wso2.org/claims/profession'],
                grade: profile['http://wso2.org/claims/grade']
            });
        })
    );

    passport.serializeUser((user, done) => {
        console.log(user);
        done(null, JSON.stringify(user));
    });

    passport.deserializeUser((data, done) => {
        done(null, JSON.parse(data));
    });
}
app.all('/authenticate', passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
    console.log(req.user);
        res.redirect('/')
    });

configurePassport();


app.get('/login', displaySignin);

app.get('/logout', doSignOut);




app.use((req, res, next) => {
    // add helper functions
    res.locals.isAuthenticated = () => !!req.user;
    res.locals.hasAnyRole = roles => !!req.user && roles.indexOf(req.user.role) > -1;
    res.locals.today = new Date();
    res.locals.signedInUser = req.user;
    next();
});


app.use(sapper());



app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);


});

module.exports = app;