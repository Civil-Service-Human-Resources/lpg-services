import {Request, Response} from 'express'
import * as learnerrecord from 'lib/learnerrecord'
import * as template from 'lib/ui/template'

export async function index(req: Request, res: Response) {
	const registrations = await learnerrecord.getRegistrations()
	res.send(
		template.render('bookings/index', req, {registrations: registrations})
	)
}
