import {Request, Response} from 'express'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/course/index')

export async function display(req: Request, res: Response) {
    logger.debug(`Displaying course, courseId: ${req.params.courseId}`)
    res.sendStatus(404)
}
