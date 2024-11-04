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
		let missingSections = 0
		let redirect: string | undefined
		for (const section of requiredSections) {
			const endpoint = `/profile/${section.pageEndpoint}`
			if (!section.setupDetails.userHasSet(user)) {
				missingSections++
				if (redirect === undefined) {
					redirect = endpoint
				}
			}
		}
		let profileSession = profileSessionObjectService.fetchObjectFromSession(req)
		if (profileSession && !profileSession.firstTimeSetup && missingSections === 0) {
			profileSessionObjectService.deleteObjectFromSession(req)
			return next()
		}
		if (!profileSession) {
			profileSession = new ProfileSession()
		}
		if (missingSections > 0) {
			if (missingSections > 1) {
				profileSession.firstTimeSetup = true
			}
			redirect = redirect!
			if (profileSession.originalUrl === undefined) {
				profileSession.originalUrl = req.originalUrl
			}
			profileSessionObjectService.saveObjectToSession(req, profileSession)
			if (req.url !== redirect) {
				return res.redirect(redirect)
			}
		}
		next()
	}
}
