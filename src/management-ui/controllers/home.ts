import * as express from 'express'

export function index(req: express.Request, res: express.Response) {
	if (req.isAuthenticated()) {
		if (req.user.hasRole('COURSE_MANAGER')) {
			res.redirect('/courses')
		} else {
			res.redirect('/reports')
		}
	} else {
		res.redirect('/sign-in')
	}
}
