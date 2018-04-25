import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as suggestionController from './suggestion'

const logger = log4js.getLogger('controllers/home')

export async function home(req: express.Request, res: express.Response) {
	logger.debug(`Getting learning record for ${req.user.id}`)
	try {
		const user = req.user as model.User
		const learningRecord = await learnerRecord.getLearningRecord(user)
		const learningHash = suggestionController.hashArray(learningRecord, 'id')
		const plannedLearning: model.Course[] = []
		const requiredLearning = (await catalog.findRequiredLearning(user)).results

		const suggestedLearning = await suggestionController.homeSuggestions(
			user,
			learningHash
		)

		const readyForFeedback = await learnerRecord.getReadyForFeedback(
			learningRecord
		)

		for (let i = 0; i < requiredLearning.length; i++) {
			const requiredCourse = requiredLearning[i]
			if (learningHash[requiredCourse.id]) {
				const course = learningHash[requiredCourse.id]
				const record = course.record!
				if (course.isComplete(user)) {
					if (course.shouldRepeat(user)) {
						requiredLearning[i].record = record
					} else {
						requiredLearning.splice(i, 1)
						i -= 1
					}
				} else {
					if (!record.state && record.modules && record.modules.length) {
						record.state = 'IN_PROGRESS'
					}
					requiredLearning[i].record = record
				}
			}
		}

		for (const course of learningRecord) {
			const record = course.record!
			if (
				!course.isComplete(user) &&
				!course.isRequired(user) &&
				record.state !== 'ARCHIVED' &&
				record.state !== 'UNREGISTERED' &&
				record.preference !== 'DISLIKED'
			) {
				if (!record.state && record.modules && record.modules.length) {
					record.state = 'IN_PROGRESS'
				}
				plannedLearning.push(course)
			}
		}

		if (req.query.delete) {
			const courseToDelete = await catalog.get(req.query.delete)
			req.flash(
				'confirmTitle',
				req.__('learning_confirm_removal_plan_title', courseToDelete!.title)
			)

			req.flash(
				'confirmMessage',
				req.__('learning_confirm_removal_plan_message')
			)

			req.flash('removeCourseId', courseToDelete!.id)
		}

		res.send(
			template.render('home', req, res, {
				confirmMessage: req.flash('confirmMessage')[0],
				confirmTitle: req.flash('confirmTitle')[0],
				plannedLearning,
				readyForFeedback,
				removeCourseId: req.flash('removeCourseId')[0],
				requiredLearning,
				successMessage: req.flash('successMessage')[0],
				successTitle: req.flash('successTitle')[0],
				suggestedLearning,
			})
		)
	} catch (e) {
		console.error("Error building user's home page", e)
		throw new Error(`Error building user's home page - ${e}`)
	}
}

export function index(req: express.Request, res: express.Response) {
	if (req.isAuthenticated()) {
		res.redirect('/home')
	} else {
		res.redirect('/sign-in')
	}
}
