import * as express from 'express'

export function index(req: express.Request, res: express.Response) {
	if (req.isAuthenticated()) {
		res.redirect('/courses')
	} else {
		res.redirect('/sign-in')
	}
}
