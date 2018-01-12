'use strict';

const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;



export function displaySignIn(req, res) {
    console.log('Displaying sign in');
    res.redirect('/');
}

export function doSignOut(req, res) {
    console.log('Signing user out');
    req.session.destroy(() => {
      res.redirect('/');
});
}

function configurePassport() {

    passport.use(new SamlStrategy({
            path: '/signin',
            entryPoint: 'https://localhost:9443/samlsso',
            issuer: 'lpg-ui',
            acceptedClockSkewMs: -1
        },
        (profile, done) => {
            done(null, { id: profile.nameID, name: profile.nameID });
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        done(null, { id: '1', name: 'Mr Misterious' });
    });
}

// function interceptUser(response) {
//     if (response.user) user = response.user;
//     return response;
// }
//
// export function init() {
//     return fetch(`/auth/user`, { credentials: 'include' })
//         .then(r => r.json())
//         .then(interceptUser);
// }