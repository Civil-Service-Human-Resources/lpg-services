import {NextFunction, Request, Response} from 'express'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/home')

export async function handleError(err: Error, req: Request, res: Response, next: NextFunction) {
	try {
		logger.error('Error handling request for', req.method, req.url, req.body, '\n', err.stack)

		res.status(500)

		let isPreProd: boolean = false

		if (req.accepts('html')) {
			if (process.env.ENV_PROFILE && ['dev', 'test'].includes(process.env.ENV_PROFILE)) {
				isPreProd = true
			}

			res.send(
				template.render('error', req, res, {
					error: err.stack,
					errorTime: new Date().toISOString(),
					isPreProd,
				})
			)
		} else if (req.accepts('json')) {
			res.send({error: err.message})
		} else {
			res.type('txt').send(`Internal error: ${err.message}`)
		}
	} catch (e) {
		console.error("Error handling error", err, e)
		next(e)
	}
}
