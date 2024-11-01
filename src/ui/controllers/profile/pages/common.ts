import {ClassConstructor, plainToInstance} from 'class-transformer'
import * as express from 'express'
import {User} from 'lib/model'
import {ValidPageModel} from '../../models/ValidPageModel'
import {generateRedirectMiddleware, MessageFlash} from '../../utils'

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
	const behaviour = generateProfilePageBehaviour(pageSpec, user, req.session!.profileOriginalUrl)
	return pageSpec.get(behaviour)
}

export function getSubmitProfilePageMiddleware<T extends ValidPageModel>(
	pageSpec: ProfilePageSpecification, req: express.Request): (req: express.Request, res: express.Response) => void {
	const user: User = req.user
	const behaviour = generateProfilePageBehaviour(pageSpec, user, req.session!.profileOriginalUrl)
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
	redirect: (req: express.Request, res: express.Response) => void,
	userSetup: boolean
}

export function redirectToProfileSuccess() {
	return generateRedirectMiddleware('/profile', new MessageFlash('profile-updated', 'profile-updated'))
}

export function redirectToProfileSetup() {
	return (req: express.Request, res: express.Response) => {
		const originalUrl = req.session!.profileOriginalUrl
		if (originalUrl !== undefined) {
			delete req.session!.profileOriginalUrl
		}
		const redirectTo = originalUrl ? originalUrl : '/home'
		res.redirect(redirectTo)
	}
}

export function generateProfilePageBehaviour(
pageSpec: ProfilePageSpecification, user: User, setupOriginalUrl?: string): PageBehaviour {
	const userSetup = (pageSpec.setupDetails.required && !pageSpec.setupDetails.userHasSet(user)) ||
		(setupOriginalUrl !== undefined)
	const templateDir = userSetup ? '/profile' : '/profile/edit'
	const templateName = `${templateDir}/${pageSpec.template}`
	let redirect: (req: express.Request, res: express.Response) => void
	console.log(setupOriginalUrl)
	if (userSetup) {
		if (pageSpec.setupDetails.nextPage && !pageSpec.setupDetails.nextPage.setupDetails.userHasSet(user)) {
			redirect = generateRedirectMiddleware(`/profile/${pageSpec.setupDetails.nextPage.pageEndpoint}`)
		} else {
			redirect = redirectToProfileSetup()
		}
	} else {
		redirect = redirectToProfileSuccess()
	}
	return {redirect, templateName, userSetup}
}
