import {ClassConstructor, plainToInstance} from 'class-transformer'
import * as express from 'express'
import {User} from 'lib/model'
import {ValidPageModel} from '../../models/ValidPageModel'
import {generateRedirectMiddleware, MessageFlash, SessionableObjectService} from '../../utils'

export enum ProfileEndpoint {
	name = 'name',
	primaryAreaOfWork = 'primary-area-of-work',
	otherAreasOfWork = 'other-areas-of-work',
	organisation = 'organisation',
	grade = 'grade',
	interests = 'interests',
	lineManager = 'line-manager',
}

export async function validate<T extends ValidPageModel>(
	classConstructor: ClassConstructor<T>, body: any) {
	const pageModel = plainToInstance(classConstructor, body)
	await pageModel.validate()
	return pageModel
}

export function getRenderProfilePageMiddleware(
	pageSpec: ProfilePageSpecification, req: express.Request) {
	const user: User = req.user
	const session = profileSessionObjectService.fetchObjectFromSession(req)
	const behaviour = generateProfilePageBehaviour(pageSpec, user, session)
	return pageSpec.get(behaviour)
}

export function getSubmitProfilePageMiddleware<T extends ValidPageModel>(
	pageSpec: ProfilePageSpecification, req: express.Request): (req: express.Request, res: express.Response) => void {
	const user: User = req.user
	const session = profileSessionObjectService.fetchObjectFromSession(req)
	const behaviour = generateProfilePageBehaviour(pageSpec, user, session)
	return pageSpec.post(behaviour)
}

export interface ProfileSetupDetails {
	required: boolean,
	userHasSet: (user: User) => boolean,
	nextPage?: ProfilePageSpecification,
}

export interface ProfilePageSpecification {
	pageEndpoint: ProfileEndpoint,
	template: string,
	setupDetails: ProfileSetupDetails,
	get(behaviour: PageBehaviour): (req: express.Request, res: express.Response) => void,
	post(behaviour: PageBehaviour): (
		req: express.Request, res: express.Response) => void
}

export interface PageBehaviour {
	templateName: string,
	userSetup: boolean
}

export function redirectToProfileSuccess() {
	return generateRedirectMiddleware('/profile', new MessageFlash('profile-updated', 'profile-updated'))
}

export function redirectToProfileSetup() {
	return (req: express.Request, res: express.Response) => {
		const profileSession = profileSessionObjectService.fetchObjectFromSession(req)
		let redirectTo = '/home'
		if (profileSession && profileSession.originalUrl !== undefined) {
			redirectTo = profileSession.originalUrl
		}
		profileSessionObjectService.deleteObjectFromSession(req)
		res.redirect(redirectTo)
	}
}

export class ProfileSession {
	constructor(public firstTimeSetup: boolean = false, public originalUrl?: string) {
	}
}

export const profileSessionObjectService =
	new SessionableObjectService('profileSetup', ProfileSession)

export function generateRedirect(
	pageSpec: ProfilePageSpecification, req: express.Request):
	(req: express.Request, res: express.Response) => void {
	const profileSession = profileSessionObjectService.fetchObjectFromSession(req)
	const nextPageDetails = pageSpec.setupDetails.nextPage
	if (profileSession && profileSession.firstTimeSetup) {
		if (nextPageDetails !== undefined) {
			return generateRedirectMiddleware(`/profile/${nextPageDetails.pageEndpoint}`)
		}
		return redirectToProfileSetup()
	}
	return redirectToProfileSuccess()
}

export function generateProfilePageBehaviour(
pageSpec: ProfilePageSpecification, user: User, profileSession?: ProfileSession): PageBehaviour {
	const userSetup = (pageSpec.setupDetails.required && !pageSpec.setupDetails.userHasSet(user)) ||
		(profileSession && profileSession.firstTimeSetup) || false
	const templateDir = userSetup ? '/profile' : '/profile/edit'
	const templateName = `${templateDir}/${pageSpec.template}`
	return {templateName, userSetup}
}