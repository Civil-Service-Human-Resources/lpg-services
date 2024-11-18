import * as express from 'express'
import {ResourceNotFoundError} from '../../../../lib/exception/ResourceNotFoundError'
import {User} from '../../../../lib/model'
import {patchCivilServantLineManager} from '../../../../lib/service/civilServantRegistry/csrsService'
import * as template from '../../../../lib/ui/template'
import {CreateLineManagerPageModel} from '../models/lineManager/createLineManagerPageModel'
import {EditLineManagerPageModel} from '../models/lineManager/editLineManagerPageModel'
import {generateRedirect, PageBehaviour, ProfileEndpoint, ProfilePageSpecification, validate} from './common'

export const lineManagerPage: ProfilePageSpecification = {
	get: getRenderLineManagerPage,
	pageEndpoint: ProfileEndpoint.lineManager,
	post: confirmLineManagerMiddleware,
	setupDetails: {
		required: false,
		userHasSet: (user: User) => {
			return user.lineManager !== undefined
		},
	},
	template: 'lineManager',
}

export function getRenderLineManagerPage(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		return res.send(template.render(behaviour.templateName, req, res))
	}
}

export function confirmLineManagerMiddleware(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const user: User = req.user
		const pageModelClass = behaviour.userSetup ? CreateLineManagerPageModel : EditLineManagerPageModel
		const pageModel = await validate(pageModelClass, req.body)
		if (pageModel.hasErrors()) {
			return res.send(template.render(behaviour.templateName, req, res, pageModel))
		}
		if (user.lineManager ? user.lineManager.email : '' !== pageModel.email) {
			if (user.userName.toLowerCase() === pageModel.email) {
				pageModel.errors = ['errors.lineManagerIsUser']
				return res.send(template.render(behaviour.templateName, req, res, pageModel))
			}
			const errors: string[] = []
			if (pageModel.email !== undefined && pageModel.email !== '') {
				try {
					await patchCivilServantLineManager(user, pageModel.email)
				} catch (error) {
					if (error instanceof ResourceNotFoundError) {
						errors.push('errors.lineManagerMissing')
					} else {
						throw error
					}
				}
			}
			if (errors.length > 0) {
				pageModel.errors = errors
				return res.send(template.render(behaviour.templateName, req, res, pageModel))
			}
		}
		return generateRedirect(lineManagerPage, req, res)
	}
}
