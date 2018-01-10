const express = require('express');
const log4js = require('log4js');
const path = require('path');
const passport = require('passport');
const lusca = require('lusca');
const config = require('config');
const session = require('express-session');

require('svelte');
require('svelte/ssr/register');

// log4js.configure(config.get('logging'));
const logger = log4js.getLogger('server');

function writePageWith(component) {
    const Template = require('./dist/index.html');

    let temphtml = Template.render({
        app: component
    });

    return temphtml.html

}

module.exports = function configureRoutes(router) {

    configurePassport();

    router.get('/Signin', displaySignIn);
    router.get('/sign-out', doSignOut);

    router.post('/Signin', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/Signin',
        failureFlash: 'Invalid email address or password.'
    }));
};

function displaySignIn(req, res) {
    logger.trace('Displaying sign in');
    if (!!req.user) {
        logger.debug('Already signed in');
        res.redirect('/');
    } else {

        const signin = require('./shared/Routes/Signin.html');
        let html = writePageWith(signin);
        res.send(html);

    }
}



function doSignOut(req, res) {
    logger.trace('Signing user out');
    req.session.destroy(() => {
        res.redirect('/');
    });
}

function configurePassport() {

    passport.use(new LocalStrategy({
            usernameField: 'emailAddress'
        },
        (emailAddress, password, done) => {
            done(null, { id: '1', name: 'Mr Misterious' });
        }
    ));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id)
            .then(user => done(null, user))
            .catch(done);
    });
}



const app = express();

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.get('session.secret')
    // FIXME: store, redis?
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(lusca.csrf());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

app.use('/dist', express.static('dist'));

app.use((req, res, next) => {
    // add helper functions
    res.locals.isAuthenticated = () => !!req.user;
    res.locals.hasAnyRole = roles => !!req.user && roles.indexOf(req.user.role) > -1;
    res.locals.today = new Date();
    res.locals.signedInUser = req.user;
    next();
});

app.get('/', (req, res) => {

    const signin = require('./shared/Routes/Signin.html');
    console.log(res);

    let html = writePageWith(signin.render().html);
    res.send(html);

});

app.get('/find', (req, res) => {

    const find = require('./shared/Routes/Find.html');

    let html = writePageWith(find.render().html);
    res.send(html);

});


app.use((err, req, res, next) => {
    logger.error('Error handling request for', req.method, req.url, req.body, '\n', err.stack);
    res.sendStatus(500);
});


const port = process.env.PORT || 1234;
app.listen(port, () => {
  // eslint-disable-next-line no-console

  console.log(`Listening to port ${port}...`);
});


module.exports = app;