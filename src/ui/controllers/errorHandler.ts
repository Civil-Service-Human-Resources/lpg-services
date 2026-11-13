import {NextFunction, Request, Response} from 'express'
import {ResourceNotFoundError} from '../../lib/exception/ResourceNotFoundError'
import {getLogger} from '../../lib/logger'
import {appInsights, appInsightsStarted} from '../../server'

const logger = getLogger('controllers/home')

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

		if (error instanceof ResourceNotFoundError) {
			return response.render('notFound.njk')
		}
		return response.render('error.njk')
	} catch (e) {
		console.error('Error handling error', error, e)
		next(e)
	}
}
