const passport = require('passport');
const lusca = require('lusca');
const config = require('config');
const express = require('express');
const path = require('path');
const fs = require('fs');
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

const LocalStrategy = require('passport-local').Strategy;


function doSignOut(req, res) {
    req.session.destroy(() => {
        res.redirect('/');
    });
}

function configurePassport() {

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id)
            .then(user => done(null, user))
            .catch(done);
    });
}



var Auth0Strategy = require('passport-auth0');

var strategy = new Auth0Strategy({
        domain:       'cshr-test.eu.auth0.com',
        clientID:     '6u7W0gNq1POal6jAHqKdoHJau9ygxb1h',
        clientSecret:  config.get('session.secret'),
        callbackURL:  '/callback'
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
        // accessToken is the token to call Auth0 API (not needed in the most cases)
        // extraParams.id_token has the JSON Web Token
        // profile has all the information from the user
        return done(null, profile);
    }
);

passport.use(strategy);



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

app.use((req, res, next) => {
    // add helper functions
    res.locals.isAuthenticated = () => !!req.user;
    res.locals.hasAnyRole = roles => !!req.user && roles.indexOf(req.user.role) > -1;
    res.locals.today = new Date();
    res.locals.signedInUser = req.user;
    next();
});

app.use((err, req, res, next) => {
    console.log('Error handling request for', req.method, req.url, req.body, '\n', err.stack);
    res.sendStatus(500);
});


app.use(bodyParser.json());

app.use(compression({ threshold: 0 }));

app.use(static('assets'));




app.get('/callback',
    passport.authenticate('auth0', { failureRedirect: '/login' }),
    function(req, res) {
        if (!req.user) {
            throw new Error('user null');
        }
        res.redirect("/");
    }
);


configurePassport();


app.get('/sign-out', doSignOut);
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: 'Invalid email address or password.'
}));

app.get('/login',
    passport.authenticate('auth0', {}), function (req, res) {
        res.redirect("/");
    });


app.use(sapper());



app.listen(PORT, () => {
	console.log(`listening on port ${PORT}`);
});

module.exports = app;