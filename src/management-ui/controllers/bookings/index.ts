import * as express from 'express'
import * as learnerrecord from 'lib/learnerrecord'
import * as template from 'lib/ui/template'

export async function index(req: express.Request, res: express.Response) {
	const registrations = await learnerrecord.getRegistrations()
	res.send(template.render('bookings/index', req, {registrations}))
}
