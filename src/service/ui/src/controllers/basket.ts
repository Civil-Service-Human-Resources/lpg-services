import * as express from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as learningRecordController from './learning-record'

export async function basketPage(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	const learningRecord = await learningRecordController.getLearningRecordOf(
		null,
		user
	)
	const plannedLearning = []
	const requiredLearning = (await catalog.findRequiredLearning(user)).entries

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
			plannedLearning,
			requiredLearning,
		})
	)
}
