import * as express from 'express'
import {User} from '../../../../lib/model'
import {patchCivilServantOrganisationUnit} from '../../../../lib/service/civilServantRegistry/csrsService'
import {getOrganisationTypeaheadForUser} from '../../../../lib/service/cslService/cslService'
import * as template from '../../../../lib/ui/template'
import {keysToOptions} from '../../../model/option'
import {OrganisationPageModel} from '../models/organisationPageModel'
import {areaOfWorkPage} from './areaOfWork'
import {generateRedirect, PageBehaviour, ProfileEndpoint, ProfilePageSpecification, validate} from './common'

export const organisationPage: ProfilePageSpecification = {
	get: getRenderOrganisationsPage,
	pageEndpoint: ProfileEndpoint.organisation,
	post: selectOrganisationsMiddleware,
	setupDetails: {
		nextPage: areaOfWorkPage,
		required: true,
		userHasSet: (user: User) => {
			return user.organisationalUnit !== undefined
		},
	},
	template: 'organisation',
}

async function getPageModel(user: User) {
	const organisations = await getOrganisationTypeaheadForUser(user)
	const options = keysToOptions(organisations)
	return new OrganisationPageModel(options)
}

export function getRenderOrganisationsPage(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const model = await getPageModel(req.user)
		return res.send(template.render(behaviour.templateName, req, res, model))
	}
}

export function selectOrganisationsMiddleware(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const user: User = req.user
		const userOrganisation = user.organisationalUnit ? user.organisationalUnit.id : 0
		const pageModel = await validate(OrganisationPageModel, req.body)
		if (pageModel.hasErrors()) {
			const organisations = await getOrganisationTypeaheadForUser(user)
			pageModel.options = keysToOptions(organisations)
			return res.send(template.render(behaviour.templateName, req, res, pageModel))
		}
		if (userOrganisation !== pageModel.organisation) {
			await patchCivilServantOrganisationUnit(user, pageModel.organisation)
		}
		return generateRedirect(organisationPage, req, res)
	}
}
