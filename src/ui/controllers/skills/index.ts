import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as suggestionController from '../suggestion'

const logger = log4js.getLogger('controllers/skills/')

export async function skills(req: express.Request, res: express.Response) {
	logger.debug(`Getting learning record for ${req.user.id}`)
	try {
		const user = req.user as model.User

		const [learningRecord] = await Promise.all([
			learnerRecord.getRawLearningRecord(user),
		])

		const learningHash = suggestionController.hashArray(
			learningRecord,
			'courseId'
		)

		const suggestedLearning = await suggestionController.homeSuggestions(
			user,
			learningHash
		)

		res.send(
			template.render('skills', req, res, {
				suggestedLearning,
			})
		)
	} catch (e) {
		console.error("Error building user's home page", e)
		throw new Error(`Error building user's home page - ${e}`)
	}
}
