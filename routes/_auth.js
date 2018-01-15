'use strict';

const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;



module.exports = function configureRoutes(router) {

    configurePassport();

    router.all('/authenticate', passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
        (req, res) => res.redirect('/'));

    router.get('/sign-in', displaySignIn);
    router.get('/sign-out', doSignOut);
};

function displaySignIn(req, res) {
    logger.trace('Displaying sign in');
    let sessionDataKey = req.query.sessionDataKey;

    if (!sessionDataKey) {
        res.redirect('/authenticate');
    } else {
        res.render('sign-in', {
            sessionDataKey
        });
    }
}

function doSignOut(req, res) {
    logger.trace('Signing user out');
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
            logger.info(profile);
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

