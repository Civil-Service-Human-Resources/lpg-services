import * as express from 'express'

export function index(req: express.Request, res: express.Response) {
	if (req.isAuthenticated()) {
		if (req.user.hasRole('COURSE_MANAGER')) {
			res.redirect('/courses')
		} else if (req.user.hasRole('MANAGE_CALL_OFF_PO')) {
			res.redirect('/purchase-orders')
		} else {
			res.redirect('/reports')
		}
	} else {
		res.redirect('/sign-in')
	}
}
