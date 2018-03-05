import * as express from 'express'
import * as catalog from 'lib/service/catalog'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/course/reset')

export async function reset(req: express.Request, res: express.Response) {
	logger.debug('Resetting course catalog')

	await catalog.resetCourses()
	res.redirect('/courses')
}
