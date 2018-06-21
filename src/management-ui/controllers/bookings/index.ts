import * as express from 'express'
import * as template from 'lib/ui/template'

export async function index(req: express.Request, res: express.Response) {
	res.send(template.render('bookings/index', req, res, {registrations: []}))
}
