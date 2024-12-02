import {NextFunction, Request, Response} from 'express'
import {getLogger} from '../../lib/logger'
import * as template from '../../lib/ui/template'
import {appInsights, appInsightsStarted} from '../../server'

const logger = getLogger('controllers/home')
const nonProductionEnvironments = ['dev', 'test']

export async function handleError(error: any, request: Request, response: Response, next: NextFunction) {
	try {
		try {
			if (appInsightsStarted) {
				appInsights.defaultClient.trackException({exception: error})
			}
		} catch {
			logger.error('Application insights failed to log the error')
		}
		logger.error(`Error handling request for ${request.method} ${request.url}\nStack: ${error.stack}`)
		if (error.response && error.response.status === 401) {
			return response.redirect('/sign-out')
		}
		response.status(500)

		const isNonProduction: boolean = !!(
			process.env.ENV_PROFILE && nonProductionEnvironments.includes(process.env.ENV_PROFILE)
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
