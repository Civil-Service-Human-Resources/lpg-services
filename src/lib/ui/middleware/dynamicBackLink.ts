import {Express, NextFunction, Request, Response} from 'express'
import {LPG_UI_SERVER, NSG_FLAG} from '../../config'

const validBackLinksForPages: Map<string, string[]> = new Map([
	['/courses/:courseId', ['/search', '/course-catalogue', (NSG_FLAG ? '/home' : '/nsg-homepage') + '/topics']],
])

export function register(app: Express) {
	validBackLinksForPages.forEach((validBackLinks, endpoint) => {
		app.use(endpoint, getMiddleware(validBackLinks))
	})
}

export function getMiddleware(validRefererEndpoints: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const referer = req.headers.referer || ''
		const match = validRefererEndpoints.some(validReferer => {
			return referer.startsWith(`${LPG_UI_SERVER}${validReferer}`)
		})
		if (referer && match) {
			res.locals.backLink = referer.replace(LPG_UI_SERVER, '')
		}
		next()
	}
}
