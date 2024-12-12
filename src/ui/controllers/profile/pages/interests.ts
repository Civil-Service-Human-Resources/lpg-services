import * as express from 'express'
import {User} from 'lib/model'
import {Interest} from 'lib/registry'
import {getInterests, patchCivilServantInterests} from 'lib/service/civilServantRegistry/csrsService'
import * as template from 'lib/ui/template'
import _ = require('lodash')
import {keysToOptions} from '../../../model/option'
import {CreateInterestsPageModel} from '../models/interests/createInterestsPageModel'
import {EditInterestsPageModel} from '../models/interests/editInterestsPageModel'
import {generateRedirect, PageBehaviour, ProfileEndpoint, ProfilePageSpecification, validate} from './common'
import {gradePage} from './grade'

export const interestsPage: ProfilePageSpecification = {
	get: getRenderInterestsPage,
	pageEndpoint: ProfileEndpoint.interests,
	post: selectInterestsMiddleware,
	setupDetails: {
		nextPage: gradePage,
		required: false,
		userHasSet: (user: User) => {
			return user.interests !== undefined
		},
	},
	template: 'interests',
}

async function getPageModel(user: User) {
	const interests = await getInterests(user)
	const userInterests = user.interests ? user.interests.map(i => i.id.toString()) : []
	const interestsOptions = keysToOptions(interests.getList(), userInterests)
	return new CreateInterestsPageModel(interestsOptions)
}

export function getRenderInterestsPage(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const model = await getPageModel(req.user)
		return res.send(template.render(behaviour.templateName, req, res, model))
	}
}

export function selectInterestsMiddleware(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const user: User = req.user
		const pageModelClass = behaviour.userSetup ?
			CreateInterestsPageModel : EditInterestsPageModel
		const userInterests = user.interests ? user.interests.map((i: Interest) => i.id.toString()) : []
		const interests = await getInterests(user)
		const pageModel = await validate(pageModelClass, req.body)
		if (pageModel.hasErrors()) {
			pageModel.options = keysToOptions(interests.getList(), userInterests)
			return res.send(template.render(behaviour.templateName, req, res, pageModel))
		}
		if (!_.isEqual(userInterests.sort(), pageModel.interestIds.sort())) {
			const selectedInterests = interests.fetchWithIds(pageModel.interestIds)
			await patchCivilServantInterests(user, selectedInterests)
		}
		return generateRedirect(interestsPage, req, res)
	}
}
