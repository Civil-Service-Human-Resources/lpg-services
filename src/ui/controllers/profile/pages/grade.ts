import * as express from 'express'
import {User} from 'lib/model'
import {getGrades, patchCivilServantGrade} from 'lib/service/civilServantRegistry/csrsService'
import * as template from 'lib/ui/template'
import {keysToOptions} from '../../../model/option'
import {GradePageModel} from '../models/gradePageModel'
import {PageBehaviour, ProfileEndpoint, ProfilePageSpecification, validate} from './common'
import {lineManagerPage} from './lineManager'

export const gradePage: ProfilePageSpecification = {
	get: getRenderGradePage,
	pageEndpoint: ProfileEndpoint.grade,
	post: confirmGradeMiddleware,
	setupDetails: {
		nextPage: lineManagerPage,
		required: false,
		userHasSet: (user: User) => {
			return user.grade !== undefined
		},
	},
	template: 'grade',
}

async function getGradePageModel(user: User) {
	const grades = await getGrades(user)
	const gradeOptions = keysToOptions(grades.getList(), user.grade ? [user.grade.id.toString()] : [])
	return new GradePageModel(gradeOptions)
}

export function getRenderGradePage(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const model = await getGradePageModel(req.user)
		return res.send(template.render(behaviour.templateName, req, res, model))
	}
}

export function confirmGradeMiddleware(behaviour: PageBehaviour) {
	return async (req: express.Request, res: express.Response) => {
		const user: User = req.user
		const userGrade = user.grade ? user.grade.id.toString() : undefined
		const grades = await getGrades(user)
		const pageModel = await validate(GradePageModel, req.body)
		if (pageModel.hasErrors()) {
			pageModel.options = keysToOptions(
				grades.getList(), userGrade ? [userGrade] : [])
			return res.send(template.render(behaviour.templateName, req, res, pageModel))
		}
		if (pageModel.grade !== userGrade) {
			const grade = grades.fetchOne(pageModel.grade)
			await patchCivilServantGrade(user, grade)
		}
		return behaviour.redirect(req, res)
	}
}
