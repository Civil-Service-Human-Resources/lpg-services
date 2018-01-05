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

