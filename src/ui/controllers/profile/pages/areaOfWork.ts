import * as express from 'express'
import {User} from 'lib/model'
import {AreaOfWork} from 'lib/registry'
import {getAreasOfWork, patchCivilServantProfession} from 'lib/service/civilServantRegistry/csrsService'
import * as template from 'lib/ui/template'
import {keysToOptions} from '../../../model/option'
import {AreaOfWorkPageModel} from '../models/areaOfWorkPageModel'
import {generateRedirect, PageBehaviour, ProfileEndpoint, ProfilePageSpecification, validate} from './common'
import {otherAreasOfWorkPage} from './otherAreasOfWork'

export const areaOfWorkPage: ProfilePageSpecification = {
	get: getRenderAreaOfWorkSelectionPage,
	pageEndpoint: ProfileEndpoint.primaryAreaOfWork,
	post: selectAreaOfWorkMiddleware,
	setupDetails: {
		nextPage: otherAreasOfWorkPage,
		required: true,
		userHasSet: (user: User) => {
			console.log(user.areaOfWork)
			return user.areaOfWork !== undefined
		},
	},
	template: 'primaryAreaOfWork',
}

async function getAreaOfWorkPageModel(user: User, areasOfWork?: AreaOfWork[]) {
	if (!areasOfWork) {
		areasOfWork = (await getAreasOfWork(user)).topLevelList
	}
	const aowOptions = keysToOptions(areasOfWork, user.areaOfWork ? [user.areaOfWork.id.toString()] : [])
	return new AreaOfWorkPageModel(aowOptions)
}

export async function renderAreaOfWorkPage(
	req: express.Request, res: express.Response, templateName: string, areasOfWork: AreaOfWork[]) {
	const model = await getAreaOfWorkPageModel(req.user, areasOfWork)
	return res.send(template.render(templateName, req, res, model))
}

export function getRenderAreaOfWorkSelectionPage(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const areasOfWork = await getAreasOfWork(req.user)
		return await renderAreaOfWorkPage(req, res, behaviour.templateName, areasOfWork.topLevelList)
	}
}

export function selectAreaOfWorkMiddleware(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const user: User = req.user
		const userAreaOfWork = user.areaOfWork ? user.areaOfWork.id : undefined
		const areasOfWork = await getAreasOfWork(user)
		const pageModel = await validate(AreaOfWorkPageModel, req.body)
		if (pageModel.hasErrors()) {
			pageModel.options = keysToOptions(
				areasOfWork.topLevelList, userAreaOfWork ? [userAreaOfWork.toString()] : [])
			return res.send(template.render(behaviour.templateName, req, res, pageModel))
		}
		const areaOfWork = areasOfWork.fetchOne(pageModel.areaOfWorkId)
		if (areaOfWork.id !== userAreaOfWork) {
			if (areaOfWork.children !== undefined && areaOfWork.children.length > 0) {
				return renderAreaOfWorkPage(req, res, behaviour.templateName, areaOfWork.children)
			}
			await patchCivilServantProfession(user, areaOfWork)
		}
		return generateRedirect(areaOfWorkPage, req)(req, res)
	}
}
