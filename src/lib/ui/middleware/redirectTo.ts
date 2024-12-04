import {Express, NextFunction, Request, Response} from 'express'
import {SessionableObjectService} from '../../../ui/controllers/utils'
import {LPG_UI_SERVER} from '../../config'

const validRedirectForEndpoints: Map<string, string[]> = new Map([['/profile/:section', ['/course', '/book']]])

class RedirectToSession {
	constructor(
		public destination: string,
		public redirectTo: string
	) {}
}

export const redirectToSessionService = new SessionableObjectService('redirectTo', RedirectToSession)

export function registerGET(app: Express) {
	validRedirectForEndpoints.forEach((validRedirects, destination) => {
		app.get(destination, getMiddlewareGET(validRedirects))
	})
}

export function registerPOST(app: Express) {
	validRedirectForEndpoints.forEach((validRedirects, destination) => {
		app.post(destination, getMiddlewarePOST())
	})
}

export function getMiddlewareGET(validRedirects: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		redirectToSessionService.deleteObjectFromSession(req)
		const redirectTo: string | undefined = req.query.redirectTo
		if (redirectTo) {
			console.log(redirectTo)
			console.log(validRedirects)
			const match = validRedirects.some(validRedirect => {
				return redirectTo.startsWith(validRedirect)
			})
			if (match) {
				const baseUrl = req.baseUrl || req.originalUrl.split('?')[0]
				const session = new RedirectToSession(baseUrl, redirectTo)
				redirectToSessionService.saveObjectToSession(req, session)
			}
		}
		next()
	}
}

export function getMiddlewarePOST() {
	return (req: Request, res: Response, next: NextFunction) => {
		const redirectSession = redirectToSessionService.fetchObjectFromSession(req)
		if (redirectSession) {
			if (req.originalUrl === redirectSession.destination) {
				redirectToSessionService.deleteObjectFromSession(req)
				return res.redirect(`${LPG_UI_SERVER}${redirectSession.redirectTo}`)
			}
		}
		next()
	}
}
