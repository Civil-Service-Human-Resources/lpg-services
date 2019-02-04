import * as express from 'express'
import * as fs from 'fs'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as path from 'path'
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

export async function startQuiz(req: express.Request, res: express.Response) {
	res.send(template.render('skills/start-quiz', req, res))
}

export async function chooseQuiz(req: express.Request, res: express.Response) {
	res.send(template.render('skills/choose-quiz', req, res))
}

export async function questions(req: express.Request, res: express.Response) {
	const numberOfQuestions = 10
	const jsonString = JSON.parse(
		fs.readFileSync(
			path.join(__dirname, '../../../../../src/questions.json'),
			'utf8'
		)
	)
	const questionsSet: any = []
	let count = 1
	while (questionsSet.length < numberOfQuestions) {
		const randomQuestion =
			jsonString[Math.floor(Math.random() * jsonString.length)]
		if (!questionsSet.includes(randomQuestion)) {
			questionsSet.push({questionNumber: count, question: randomQuestion})
			count++
		}
	}
	req.session!.questions = [questionsSet]

	res.send(
		template.render('skills/questions', req, res, {results: questionsSet})
	)

}

export async function quizSummary(req: express.Request, res: express.Response) {
	res.send(template.render('skills/quiz-summary', req, res))
}
