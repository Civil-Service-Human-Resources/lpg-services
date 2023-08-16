import * as express from 'express'
import * as extended from 'lib/extended'
import {getLogger} from 'lib/logger'
import * as model from 'lib/model'

import {fetchSuggestedLearning} from 'lib/service/catalog/suggestedLearning/suggestedLearningService'
import {Suggestion} from 'lib/service/catalog/suggestedLearning/suggestion'
import * as cslService from 'lib/service/cslService/cslServiceClient'
import * as template from 'lib/ui/template'

const logger = getLogger('controllers/suggestion')

export async function addToPlan(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const ref = req.query.ref
	const course = req.course

	let redirectTo = '/suggestions-for-you'
	switch (ref) {
		case 'home':
		case 'search':
			redirectTo = '/'
			break
	}
	try {
		await cslService.addCourseToLearningPlan(course.id, req.user)

		req.flash('successTitle', req.__('learning_added_to_plan_title', course.title))
		req.flash('successMessage', req.__('learning_added_to_plan_message', course.title))
		req.flash('successId', course.id)
		req.session!.save(() => {
			res.redirect(redirectTo)
		})
	} catch (err) {
		logger.error('Error adding course to learning plan', err)
		res.sendStatus(500)
	}
}
export async function removeFromSuggestions(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const ref = req.query.ref === 'home' || req.query.ref === 'search' ? '/' : '/suggestions-for-you'
	const course = req.course

	try {
		await cslService.removeCourseFromSuggestions(course.id, req.user)
		req.flash('successTitle', req.__('learning_removed_from_plan_title', course.title))
		req.flash('successMessage', req.__('learning_removed_from_suggestions', course.title))
	} catch (err) {
		logger.error('Error removing course from suggestions', err)
		res.sendStatus(500)
	} finally {
		res.redirect(ref)
	}
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
