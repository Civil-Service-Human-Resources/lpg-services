import * as express from 'express'
import * as extended from 'lib/extended'
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

		const [ learningRecord, requiredLearningResults ] = await Promise.all([
			learnerRecord.getLearningRecord(user),
			catalog.findRequiredLearning(user),
		])

		const requiredLearning = requiredLearningResults.results

		const learningHash = suggestionController.hashArray(learningRecord, 'id')

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

		const bookedLearning: model.Course[] = []
		let plannedLearning: model.Course[] = []

		for (const course of learningRecord) {
			const record = course.record!
			if (
				!course.isComplete(user) &&
				!course.isRequired(user) &&
				learnerRecord.isActive(record)
			) {
				if (!record.state && record.modules && record.modules.length) {
					record.state = 'IN_PROGRESS'
				}
				if (course.getSelectedDate()) {
					const bookedModuleRecord = course.record!.modules.find(m => !!m.eventId)
					if (bookedModuleRecord) {
						record.state = bookedModuleRecord.bookingStatus
					}
					bookedLearning.push(course)
				} else {
					plannedLearning.push(course)
				}
			}
		}

		bookedLearning.sort((a, b) => {
			return a.getSelectedDate()!.getDate() - b.getSelectedDate()!.getDate()
		})

		plannedLearning = [...bookedLearning, ...plannedLearning]

		let removeCourseId
		let confirmTitle
		let confirmMessage
		let eventActionDetails
		let action = ''
		let yesOption
		let noOption

		if (req.query.delete) {
			const courseToDelete = await catalog.get(req.query.delete)
			confirmTitle = req.__(
				'learning_confirm_removal_plan_title',
				courseToDelete!.title
			)
			removeCourseId = courseToDelete!.id
			confirmMessage = req.__('learning_confirm_removal_plan_message')
		}

		if (req.query.skip) {
			action = 'skip'
		}

		if (req.query.move) {
			action = 'move'
		}

		if (req.query.skip || req.query.move) {
			eventActionDetails = req.query[action].split(',')
			eventActionDetails.push(action)
			const module = await catalog.get(eventActionDetails[0])

			confirmTitle = req.__(
				'learning_confirm_' + action + '_plan_title',
				module!.title
			)

			confirmMessage = req.__('learning_confirm_' + action + '_plan_message')
			yesOption = req.__('learning_confirm_' + action + '_yes_option')
			noOption = req.__('learning_confirm_' + action + '_no_option')
		}

		res.send(
			template.render('home', req, res, {
				confirmMessage,
				confirmTitle,
				eventActionDetails,
				noOption,
				plannedLearning,
				readyForFeedback,
				removeCourseId,
				requiredLearning,
				successId: req.flash('successId')[0],
				successMessage: req.flash('successMessage')[0],
				successTitle: req.flash('successTitle')[0],
				suggestedLearning,
				yesOption,
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

export function cookies(ireq: express.Request, res: express.Response) {
	res.cookie('seen_cookie_message', 'yes')

	const req = ireq as extended.CourseRequest
	res.send(template.render('/cookies', req, res, {}))
}
