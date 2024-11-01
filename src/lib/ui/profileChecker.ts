import {Express, NextFunction, Request, Response} from 'express'
// import {getLogger} from 'lib/logger'
import {profilePages} from '../../ui/controllers/profile'
import {
	ProfilePageSpecification,
	ProfileSession,
	profileSessionObjectService,
} from '../../ui/controllers/profile/pages/common'
import {User} from '../model'

// const logger = getLogger('profileChecker')

export function register(app: Express) {
	const requiredSections = profilePages.filter(p => p.setupDetails.required)
	app.use(getMiddleware(requiredSections))
}

function getMiddleware(requiredSections: ProfilePageSpecification[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const user: User = req.user
		const url = req.url
		let profileSession = profileSessionObjectService.fetchObjectFromSession(req)
		if (profileSession === undefined) {
			const firstTimeSetup = requiredSections
				.filter(rs => !rs.setupDetails.userHasSet(user)).length > 1
			console.log(`First time setup: ${firstTimeSetup}`)
			profileSession = new ProfileSession(firstTimeSetup)
			profileSessionObjectService.saveObjectToSession(req, profileSession)
		}
		for (const section of requiredSections) {
			const endpoint = `/profile/${section.pageEndpoint}`
			if (url === endpoint) {
				return next()
			} else {
				if (!section.setupDetails.userHasSet(user)) {
					if (profileSession.originalUrl === undefined) {
						profileSession.originalUrl = req.originalUrl
						profileSessionObjectService.saveObjectToSession(req, profileSession)
					}
					return req.session!.save(() => {
						console.log(`Redirecting to ${endpoint}`)
						res.redirect(endpoint)
					})
				}
			}
		}
		next()
	}
}
