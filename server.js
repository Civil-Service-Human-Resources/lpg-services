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


app.use(lusca.csrf());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));


app.use((err, req, res, next) => {
    console.log('Error handling request for', req.method, req.url, req.body, '\n', err.stack);
    res.sendStatus(500);
});


app.use(bodyParser.json());

app.use(compression({ threshold: 0 }));

app.use(static('assets'));

const SamlStrategy = require('passport-saml').Strategy;


function displaylogin(req, res) {

    let sessionDataKey = req.query.sessionDataKey;
    console.log(sessionDataKey);
    const loginPage = require('./routes/login/index.html');
    goto('/authenticate');
    //res.send(loginPage);
    /*if (!sessionDataKey) {
        res.redirect('/authenticate');
    } else {
        const loginPage = require('/routes/index.html');
        console.log
        res.send(loginPage.render())
    }*/
}

function doSignOut(req, res) {
    console.log('Signing user out');
    req.session.destroy(() => {
        res.redirect('/');
    });
}

function configurePassport() {

    passport.use(new SamlStrategy({
            path: '/authenticate',
            entryPoint: 'https://localhost:9443/samlsso',
            issuer: 'lpg-ui',
            acceptedClockSkewMs: -1
        },
        (profile, done) => {
            console.log(profile);
            done(null, {
                emailAddress: profile.nameID,
                department: profile['http://wso2.org/claims/department'],
                profession: profile['http://wso2.org/claims/profession'],
                grade: profile['http://wso2.org/claims/grade']
            });
        })
    );

    passport.serializeUser((user, done) => {
        done(null, JSON.stringify(user));
    });

    passport.deserializeUser((data, done) => {
        done(null, JSON.parse(data));
    });
}
configurePassport();

app.all('/authenticate', passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    (req, res) => {
        res.redirect('/')
    });


app.get('/logout', doSignOut);

app.use((req, res, next) => {
    // add helper functions
    res.locals.isAuthenticated = () => !!req.user;
    res.locals.hasAnyRole = roles => !!req.user && roles.indexOf(req.user.role) > -1;
    res.locals.today = new Date();
    res.locals.signedInUser = req.user;
    next();
});

// app.get('/login', displaylogin);

app.use(sapper());



app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);


});

module.exports = app;