import * as express from 'express'
import * as extended from 'lib/extended'
import { getLogger } from 'lib/logger'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'

import {
	fetchSuggestedLearning
} from '../../lib/service/catalog/suggestedLearning/suggestedLearningService'
import { Suggestion } from '../../lib/service/catalog/suggestedLearning/suggestion'
import {
	AddCourseToLearningplanActionWorker
} from '../../lib/service/learnerRecordAPI/workers/courseRecordActionWorkers/AddCourseToLearningplanActionWorker'
import {
	RemoveCourseFromLearningplanActionWorker
} from '../../lib/service/learnerRecordAPI/workers/courseRecordActionWorkers/RemoveCourseFromLearningplanActionWorker'

const logger = getLogger('controllers/suggestion')

export function hashArray<T>(records: T[], key: string) {
	const hash: Record<string, T> = {}
	for (const entry of records) {
		const hashIndex: string = (entry as any)[key]
		hash[hashIndex] = entry
	}
	return hash
}

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
		await new AddCourseToLearningplanActionWorker(course, req.user).applyActionToLearnerRecord()

		req.flash('successTitle', req.__('learning_added_to_plan_title', course.title))
		req.flash('successMessage', req.__('learning_added_to_plan_message', course.title))
		req.flash('successId', course.id)
		req.session!.save(() => {
			res.redirect(redirectTo)
		})
	} catch (err) {
		logger.error('Error recording xAPI statement', err)
		res.sendStatus(500)
	}
}
export async function removeFromSuggestions(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const ref = req.query.ref === 'home' || req.query.ref === 'search' ? '/' : '/suggestions-for-you'
	const course = req.course

	try {
		await new RemoveCourseFromLearningplanActionWorker(course, req.user).applyActionToLearnerRecord()
		req.flash('successTitle', req.__('learning_removed_from_plan_title', course.title))
		req.flash('successMessage', req.__('learning_removed_from_suggestions', course.title))
	} catch (err) {
		logger.error('Error recording xAPI statement', err)
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
