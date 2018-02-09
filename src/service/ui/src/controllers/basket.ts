import {Request, Response} from 'express'
import {User} from 'lib/model/user'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as learningRecordController from './learning-record'

export async function basketPage(req: Request, res: Response) {
	const user = req.user as User
	if (user.department) {
		const learningRecord = await learningRecordController.getLearningRecordOf(
			null,
			user
		)
		const plannedLearning = []
		let requiredLearning = (await catalog.findRequiredLearning(user)).entries

		for (const record of learningRecord) {
			let found = false
			for (const [i, requiredCourse] of requiredLearning.entries()) {
				if (requiredCourse.uid === record.uid) {
					if (record.state === 'completed') {
						requiredLearning.splice(i, 1)
					} else {
						requiredLearning[i] = record
					}
					found = true
					break
				}
			}
			if (!found && record.state !== 'completed') {
				plannedLearning.push(record)
			}
		}

		res.send(
			template.render('basket', req, {
				requiredLearning,
				plannedLearning,
			})
		)
	} else {
		res.redirect('/profile')
	}
}
