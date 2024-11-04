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

export function getMiddleware(requiredSections: ProfilePageSpecification[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		const user: User = req.user
		const url = req.url
		let missingSections = 0
		let redirect: string | undefined
		for (const section of requiredSections) {
			const endpoint = `/profile/${section.pageEndpoint}`
			if (!section.setupDetails.userHasSet(user)) {
				missingSections++
				if (url !== endpoint && redirect === undefined) {
					redirect = endpoint
				}
			}
		}
		if (missingSections === 0) {
			profileSessionObjectService.deleteObjectFromSession(req)
			return next()
		}
		let profileSession = profileSessionObjectService.fetchObjectFromSession(req)
		if (profileSession === undefined) {
			profileSession = new ProfileSession()
		}
		if (missingSections > 1) {
			profileSession.firstTimeSetup = true
		}
		profileSession.originalUrl = req.originalUrl
		profileSessionObjectService.saveObjectToSession(req, profileSession)
		if (redirect !== undefined) {
			return res.redirect(redirect)
		}
		next()
	}
}
