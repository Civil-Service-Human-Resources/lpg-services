import * as express from 'express'
import * as extended from 'lib/extended'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/learning-record/feedback')

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
			res.redirect('/learning-record')
		})
	} else {
		logger.debug(
			`Displaying feedback for course ${course.id} and module ${module.id}`
		)
		res.send(
			template.render('learning-record/feedback', req, res, {
				course,
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

	// TODO validate

	await xapi.record(req, course, xapi.Verb.Rated, undefined, module)

	req.flash('successTitle', 'learning_feedback_submitted_title')
	req.flash('successMessage', 'learning_feedback_submitted_message')
	req.session!.save(() => {
		res.redirect('/learning-record')
	})
}
