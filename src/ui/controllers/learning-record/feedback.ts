import * as express from 'express'
import * as extended from 'lib/extended'
import {getLogger} from 'lib/logger'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import { getLearningRecord, getReadyForFeedback } from 'lib/client/learnerrecord'

const logger = getLogger('controllers/learning-record/feedback')

export async function displayFeedback(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	const module = req.module!

	if (req.query.ignore) {
		logger.debug(
			`Ignoring feedback for course ${course.id} and module ${module.id}`
		)

		await xapi.record(req, course, xapi.Verb.Rated, undefined, module)

		req.session!.save(() => {
			res.redirect('/home')
		})
	} else {
		logger.debug(
			`Displaying feedback for course ${course.id} and module ${module.id}`
		)

		let categories

		if (
			course.getType() === 'blended' ||
			module.type === 'elearning' ||
			module.type === 'face-to-face'
		) {
			categories = ['presentation', 'content', 'relevance', 'interactivity']
		} else {
			categories = ['content', 'relevance']
		}

		res.send(
			template.render('learning-record/feedback', req, res, {
				categories,
				course,
				invalidFeedback: req.flash('invalidFeedback')[0],
				module,
			})
		)
	}
}

export async function submitFeedback(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	const module = req.module!

	const feedback = req.body

	if (
		!(
			feedback.comments ||
			feedback.presentation ||
			feedback.content ||
			feedback.relevance ||
			feedback.interactivity
		)
	) {
		req.flash('invalidFeedback', 'true')
		req.session!.save(() => {
			res.redirect(`/learning-record/${course.id}/${module.id}/feedback`)
		})
	} else {
		await catalog.postFeedback({
			...feedback,
			courseId: course.id,
			moduleId: module.id,
			userId: req.user.id,
		}, req.user)
		await xapi.record(req, course, xapi.Verb.Rated, undefined, module)

		req.flash('successTitle', req.__('learning_feedback_submitted_title'))
		req.flash('successMessage', req.__('learning_feedback_submitted_message'))
		req.session!.save(() => {
			res.redirect('/learning-record/feedback')
		})
	}
}

export async function listItemsForFeedback(
	req: express.Request,
	res: express.Response
) {
	const learningRecord = await getLearningRecord(req.user)
	const readyForFeedback = await getReadyForFeedback(
		learningRecord
	)

	res.send(
		template.render('learning-record/feedback-list', req, res, {
			readyForFeedback,
			successMessage: req.flash('successMessage')[0],
			successTitle: req.flash('successTitle')[0],
		})
	)
}
