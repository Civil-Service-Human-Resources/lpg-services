import * as express from 'express'
import {User} from 'lib/model'
import {AreaOfWork} from 'lib/registry'
import {getAreasOfWork, patchCivilServantOtherAreasOfWork} from 'lib/service/civilServantRegistry/csrsService'
import * as template from 'lib/ui/template'
import _ = require('lodash')
import {keysToOptions} from '../../../model/option'
import {OtherAreasOfWorkPageModel} from '../models/otherAreasOfWorkPageModel'
import {PageBehaviour, ProfileEndpoint, ProfilePageSpecification, validate} from './common'

export const otherAreasOfWorkPage: ProfilePageSpecification = {
	get: getRenderOtherAreasOfWorkSelectionPage,
	pageEndpoint: ProfileEndpoint.otherAreasOfWork,
	post: selectOtherAreasOfWorkMiddleware,
	setupDetails: {
		nextPage: ProfileEndpoint.interests,
		required: true,
		userHasSet: (user: User) => {
			return (user.otherAreasOfWork !== undefined && user.otherAreasOfWork.length > 0)
		},
	},
	template: 'otherAreasOfWork',
}

async function getPageModel(user: User) {
	const areasOfWork = await getAreasOfWork(user)
	const selections = user.otherAreasOfWork ? user.otherAreasOfWork.map(aow => aow.id.toString()) : []
	const options = keysToOptions(areasOfWork.topLevelList, selections)
	return new OtherAreasOfWorkPageModel(options)
}

export function getRenderOtherAreasOfWorkSelectionPage(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const model = await getPageModel(req.user)
		return res.send(template.render(behaviour.templateName, req, res, model))
	}
}

export function selectOtherAreasOfWorkMiddleware(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const user: User = req.user
		const areasOfWork = await getAreasOfWork(user)
		const userOtherAreaOfWork = user.otherAreasOfWork ? user.otherAreasOfWork.map(
			(aow: AreaOfWork) => aow.id.toString()) : []
		const pageModel = await validate(OtherAreasOfWorkPageModel, req.body)
		if (pageModel.hasErrors()) {
			pageModel.options = keysToOptions(areasOfWork.topLevelList, userOtherAreaOfWork)
			return res.send(template.render(behaviour.templateName, req, res, pageModel))
		}
		if (!_.isEqual(userOtherAreaOfWork.sort(), pageModel.otherAreasOfWork.sort())) {
			const selectedAreasOfWork = areasOfWork.fetchWithIds(pageModel.otherAreasOfWork)
			await patchCivilServantOtherAreasOfWork(user, selectedAreasOfWork)
		}
		return behaviour.redirect(req, res)
	}
}
