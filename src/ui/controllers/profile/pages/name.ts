import * as express from 'express'
import {User} from '../../../../lib/model'
import {patchCivilServantName} from '../../../../lib/service/civilServantRegistry/csrsService'
import * as template from '../../../../lib/ui/template'
import {GivenNamePageModel} from '../models/givenNamePageModel'
import {generateRedirect, PageBehaviour, ProfileEndpoint, ProfilePageSpecification, validate} from './common'
import {organisationPage} from './organisation'

export const namePage: ProfilePageSpecification = {
	get: getRenderGivenNamePage,
	pageEndpoint: ProfileEndpoint.name,
	post: confirmNameMiddleware,
	setupDetails: {
		nextPage: organisationPage,
		required: true,
		userHasSet: (user: User) => {
			return user.givenName !== undefined
		},
	},
	template: 'name',
}

export function getRenderGivenNamePage(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const model = new GivenNamePageModel(req.user.givenName || '')
		return res.send(template.render(behaviour.templateName, req, res, model))
	}
}

export function confirmNameMiddleware(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const user: User = req.user
		const userGivenName = user.givenName || ''
		const pageModel = await validate(GivenNamePageModel, req.body)
		if (pageModel.hasErrors()) {
			return res.send(template.render(behaviour.templateName, req, res, pageModel))
		}
		if (userGivenName !== pageModel.value) {
			await patchCivilServantName(user, pageModel.value)
		}
		return generateRedirect(namePage, req, res)
	}
}
