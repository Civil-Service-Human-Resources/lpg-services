import * as express from 'express'
import * as model from '../../lib/model'
import {fetchSuggestedLearning} from '../../lib/service/catalog/suggestedLearning/suggestedLearningService'
import {Suggestion} from '../../lib/service/catalog/suggestedLearning/suggestion'
import * as cslService from '../../lib/service/cslService/cslServiceClient'
import * as template from '../../lib/ui/template'

export async function addToPlan(req: express.Request, res: express.Response) {
	const ref = req.query.ref

	let redirectTo = '/suggestions-for-you'
	const courseId = req.params.courseId
	switch (ref) {
		case 'home':
		case 'search':
			redirectTo = '/'
			break
	}
	const resp = await cslService.addCourseToLearningPlan(req.params.courseId, req.user)

	req.flash('successTitle', req.__('learning_added_to_plan_title', resp.courseTitle))
	req.flash('successMessage', req.__('learning_added_to_plan_message', resp.courseTitle))
	req.flash('successId', courseId)
	req.session!.save(() => {
		res.redirect(redirectTo)
	})
}
export async function removeFromSuggestions(req: express.Request, res: express.Response) {
	const ref = req.query.ref === 'home' || req.query.ref === 'search' ? '/' : '/suggestions-for-you'
	const courseId = req.params.courseId
	const resp = await cslService.removeCourseFromSuggestions(courseId, req.user)
	req.flash('successTitle', req.__('learning_removed_from_plan_title', resp.courseTitle))
	req.flash('successMessage', req.__('learning_removed_from_suggestions', resp.courseTitle))
	res.redirect(ref)
}

export async function suggestionsPage(req: express.Request, res: express.Response) {
	const user = req.user as model.User

	const map = await fetchSuggestedLearning(user, res.locals.departmentHierarchyCodes)

	const department = map.getMapping(Suggestion.DEPARTMENT)
	const areaOfWork = map.getMapping(Suggestion.AREA_OF_WORK)
	const otherAreasOfWork = map.getMapping(Suggestion.OTHER_AREAS_OF_WORK)
	const interests = map.getMapping(Suggestion.INTERESTS)

	res.send(
		template.render('suggested', req, res, {
			areaOfWork,
			department,
			interests,
			otherAreasOfWork,
			successMessage: req.flash('successMessage')[0],
			successTitle: req.flash('successTitle')[0],
		})
	)
}
