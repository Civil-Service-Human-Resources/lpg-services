import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as suggestionController from './suggestion'

function hashArray(courses: model.Course[], key: string) {
	const hash: Record<string, model.Course> = {}
	for (const entry of courses) {
		const hashIndex: string = (entry as any)[key]
		hash[hashIndex] = entry
	}
	return hash
}

export async function home(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	const learningRecord = await learnerRecord.getLearningRecordOf(null, user)
	let learningHash = hashArray(learningRecord, 'uid')
	const plannedLearning: model.Course[] = []
	const requiredLearning = (await catalog.findRequiredLearning(user)).entries
	learningHash = hashArray(requiredLearning, 'uid')

	const suggestedLearning = (await suggestionController.suggestions(
		user,
		learningRecord
	)).slice(0, 6)

	for (const [i, requiredCourse] of requiredLearning.entries()) {
		if (learningHash[requiredCourse.uid]) {
			const record = learningHash[requiredCourse.uid]
			if (record.state === 'completed' && !record.shouldRepeat()) {
				requiredLearning.splice(i, 1)
			} else {
				if (record.state === 'completed') {
					record.state = undefined
				}
				requiredLearning[i] = record
			}
			delete learningHash[requiredCourse.uid]
		}
	}
	/// learninghash is now a collection that do not have items in requiredLearning
	Object.entries(learningHash).forEach((entry, key) => {
		const record = entry[1] as model.Course
		if (
			record.state !== 'COMPLETED' &&
			record.state !== 'UNREGISTERED' &&
			record.state !== 'TERMINATED' &&
			record.preference !== 'disliked'
		) {
			plannedLearning.push(record)
		}
	})

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
