import {NextFunction, Request, Response} from 'express'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/home')

export async function handleError(error: Error, request: Request, response: Response, next: NextFunction) {
	try {
		logger.error('Error handling request for', request.method, request.url, request.body, '\n', error.stack)

		response.status(500)

		let isPreProd: boolean = false

		if (process.env.ENV_PROFILE && ['dev', 'test'].includes(process.env.ENV_PROFILE)) {
			isPreProd = true
		}

		response.send(
			template.render('error', request, response, {
				error: error.stack,
				errorTime: new Date().toISOString(),
				isPreProd,
			})
		)
	} catch (e) {
		console.error("Error handling error", error, e)
		next(e)
	}
}
