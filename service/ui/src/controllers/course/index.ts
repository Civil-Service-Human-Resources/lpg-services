import {Request, Response, NextFunction} from 'express'
import * as log4js from 'log4js'
import * as catalog from 'lib/service/catalog'
import * as elko from 'lib/service/elko'

const logger = log4js.getLogger('controllers/course/index')

export async function loadCourse(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const course = await catalog.get(elko.context(), {id: req.params.courseId})
	if (course) {
		req.course = course
		next()
	} else {
		res.sendStatus(404)
	}
}

export async function display(req: Request, res: Response) {
	logger.debug(`Displaying course, courseId: ${req.params.courseId}`)
	res.sendStatus(404)
}
