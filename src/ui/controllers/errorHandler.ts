import {NextFunction, Request, Response} from 'express'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/home')
const nonProductionEnvironments = ['dev', 'test']

export async function handleError(
	error: Error,
	request: Request,
	response: Response,
	next: NextFunction
) {
	// @ts-ignore
	if (error.response && error.response.status === 401) {
		return response.redirect('/sign-out')
	}

	try {
		logger.error(
			'Error handling request for',
			request.method,
			request.url,
			request.body,
			'\n',
			error.stack
		)

		response.status(500)

		const isNonProduction: boolean = !!(
			process.env.ENV_PROFILE &&
			nonProductionEnvironments.includes(process.env.ENV_PROFILE)
		)

		response.send(
			template.render('error', request, response, {
				error: error.stack,
				errorTime: new Date().toISOString(),
				isNonProd: isNonProduction,
			})
		)
	} catch (e) {
		console.error('Error handling error', error, e)
		next(e)
	}
}
