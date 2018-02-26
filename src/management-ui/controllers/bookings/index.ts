import {Request, Response} from 'express'
import * as catalog from 'lib/service/catalog'
import * as log4js from 'log4js'
import * as template from 'lib/ui/template'

export async function index(req: Request, res: Response) {
	// const result = await catalog.listAll({})

	res.send(template.render('bookings/index', req, {}))
}
