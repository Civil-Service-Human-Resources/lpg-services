import {Request, Response} from 'express'
import {resetCourses} from 'lib/service/catalog'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/course/reset')

export async function reset(req: Request, res: Response) {
	logger.debug('Resetting course catalog')

	await resetCourses()
	res.redirect('/courses')
}
