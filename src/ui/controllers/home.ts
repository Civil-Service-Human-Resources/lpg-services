import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as suggestionController from './suggestion'

export async function home(req: express.Request, res: express.Response) {
	try {
		const user = req.user as model.User
		const learningRecord = await learnerRecord.getLearningRecordOf(null, user)
		const plannedLearning = []
		const requiredLearning = (await catalog.findRequiredLearning(user)).entries
		const suggestedLearning = (await suggestionController.suggestions(
			user
		)).slice(0, 6)

		for (const course of learningRecord) {
			let found = false
			const record = course.record!
			for (const [i, requiredCourse] of requiredLearning.entries()) {
				if (requiredCourse.id === course.id) {
					if (record.state === 'COMPLETED' && !course.shouldRepeat(req.user)) {
						requiredLearning.splice(i, 1)
					} else {
						if (record.state === 'COMPLETED') {
							record.state = undefined
						}
						requiredLearning[i].record = course.record
					}
					found = true
					break
				}
			}
			if (
				!found &&
				record.state !== 'COMPLETED' &&
				record.state !== 'UNREGISTERED' &&
				record.state !== 'TERMINATED' &&
				record.preference !== 'DISLIKED'
			) {
				plannedLearning.push(course)
			}
		}

		res.send(
			template.render('home', req, {
				plannedLearning,
				requiredLearning,
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
