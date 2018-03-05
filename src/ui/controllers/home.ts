import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as suggestionController from './suggestion'

export async function home(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	const learningRecord = await learnerRecord.getLearningRecordOf(null, user)
	const plannedLearning = []
	const requiredLearning = (await catalog.findRequiredLearning(user)).entries
	const suggestedLearning = (await suggestionController.suggestions(
		user
	)).slice(0, 6)

	for (const record of learningRecord) {
		let found = false
		for (const [i, requiredCourse] of requiredLearning.entries()) {
			if (requiredCourse.uid === record.uid) {
				if (record.state === 'completed' && !record.shouldRepeat()) {
					requiredLearning.splice(i, 1)
				} else {
					if (record.state === 'completed') {
						record.state = undefined
					}
					requiredLearning[i] = record
				}
				found = true
				break
			}
		}
		if (
			!found &&
			record.state !== 'completed' &&
			record.state !== 'unregistered' &&
			record.state !== 'terminated' &&
			record.preference !== 'disliked'
		) {
			plannedLearning.push(record)
		}
	}

	res.send(
		template.render('home', req, {
			plannedLearning,
			requiredLearning,
			suggestedLearning,
		})
	)
}

export function index(req: express.Request, res: express.Response) {
	if (req.isAuthenticated()) {
		res.redirect('/home')
	} else {
		res.redirect('/sign-in')
	}
}
