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
		const learningRecord = await learnerRecord.getLearningRecordOf(null, user)
		const learningHash = learningRecord.length
			? suggestionController.hashArray(learningRecord, 'id')
			: {}
		const plannedLearning: model.Course[] = []
		const requiredLearning = (await catalog.findRequiredLearning(user)).entries

		const suggestedLearning = (await suggestionController.suggestions(
			user,
			learningHash
		)).slice(0, 6)

		for (const [i, requiredCourse] of requiredLearning.entries()) {
			if (learningHash[requiredCourse.id]) {
				const course = learningHash[requiredCourse.id]
				const record = course.record!
				if (record.state === 'COMPLETED' && !course.shouldRepeat(user)) {
					requiredLearning.splice(i, 1)
				} else {
					if (record.state === 'COMPLETED') {
						record.state = undefined
					}
					requiredLearning[i].record = record
				}
				delete learningHash[requiredCourse.id]
			}
		}
		/// learninghash is now a collection that do not have items in requiredLearning
		Object.entries(learningHash).forEach((entry, key) => {
			const course = entry[1] as model.Course
			const record = course.record!
			if (
				record.state !== 'COMPLETED' &&
				record.state !== 'UNREGISTERED' &&
				record.state !== 'TERMINATED' &&
				record.preference !== 'DISLIKED'
			) {
				plannedLearning.push(course)
			}
		})
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
