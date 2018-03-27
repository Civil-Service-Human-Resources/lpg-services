import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as suggestionController from './suggestion'

const logger = log4js.getLogger('controllers/home')

export async function home(req: express.Request, res: express.Response) {
	logger.debug(`Getting  learning record for ${req.user.id}`)
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
				if (course.isComplete(user) && !course.shouldRepeat(user)) {
					requiredLearning.splice(i, 1)
					i -= 1
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

		res.send(
			template.render('home', req, res, {
				plannedLearning,
				readyForFeedback,
				requiredLearning,
				successMessage: req.flash('successMessage')[0],
				successTitle: req.flash('successTitle')[0],
				suggestedLearning,
			})
		)
	} catch (e) {
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
