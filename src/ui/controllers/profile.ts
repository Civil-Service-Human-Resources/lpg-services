import * as express from 'express'
import {Request, Response} from 'express'
import * as config from 'lib/config'
import {getLogger} from 'lib/logger'
import * as template from '../../lib/ui/template'
import {areaOfWorkPage} from './profile/pages/areaOfWork'
import {
	getRenderProfilePageMiddleware, getSubmitProfilePageMiddleware,
	ProfileEndpoint,
	ProfilePageSpecification,
} from './profile/pages/common'
import {gradePage} from './profile/pages/grade'
import {interestsPage} from './profile/pages/interests'
import {lineManagerPage} from './profile/pages/lineManager'
import {namePage} from './profile/pages/name'
import {organisationPage} from './profile/pages/organisation'
import {otherAreasOfWorkPage} from './profile/pages/otherAreasOfWork'

const logger = getLogger('profile')

export function addEmail(request: Request, response: Response) {
	logger.debug(`User ${request.user.userName} requesting to change email`)
	response.send(template.render('profile/email', request, response))
}

export async function updateEmail(request: Request, response: Response) {
	return response.redirect(config.AUTHENTICATION.serviceUrl + '/account/email')
}

export function viewProfile(req: express.Request, res: express.Response) {
	if (req.session!.flash && req.session!.flash.children) {
		delete req.session!.flash.children
	}
	res.send(
		template.render('profile/view', req, res, {
			updateSuccessful: req.flash('profile-updated').length > 0,
			user: req.user,
			validFields: true,
		})
	)
}

export const profilePages = [
	namePage, organisationPage, areaOfWorkPage, otherAreasOfWorkPage, interestsPage, gradePage, lineManagerPage,
]

export const profilePageMap: Map<ProfileEndpoint, ProfilePageSpecification> = new Map(
	profilePages.map((page): [ProfileEndpoint, ProfilePageSpecification] => [page.pageEndpoint, page])
)

export async function getGETProfileMiddleware(req: express.Request, endpoint: ProfileEndpoint) {
	const page = profilePageMap.get(endpoint)
	return getRenderProfilePageMiddleware(page!, req)
}

export async function getPOSTProfileMiddleware(req: express.Request, endpoint: ProfileEndpoint) {
	const page = profilePageMap.get(endpoint)
	return getSubmitProfilePageMiddleware(page!, req)
}
