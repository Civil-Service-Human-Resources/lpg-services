import {Express, NextFunction, Request, Response} from 'express'
import {LPG_UI_SERVER} from 'lib/config'

const validBackLinksForPages: Map<string, string[]> = new Map([
	["/courses/:courseId", ["/search"]],
])

export function register(app: Express) {
	validBackLinksForPages.forEach((validBackLinks, endpoint) => {
		app.use(endpoint, getMiddleware(validBackLinks))
	})
}

export function getMiddleware(validReferers: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const referer = (req.headers.referer || '').replace(LPG_UI_SERVER, '')
		const match = validReferers.some(validReferer => {
			return referer.startsWith(validReferer)
		})
		if (referer && match) {
			res.locals.backLink = referer.replace(LPG_UI_SERVER, '')
		}
		next()
	}
}
