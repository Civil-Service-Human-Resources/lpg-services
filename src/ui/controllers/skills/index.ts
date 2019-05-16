import * as express from 'express'
import * as model from 'lib/model'
import * as skillsApi from "lib/service/skills"
import * as template from 'lib/ui/template'

export function introduction(req: express.Request, res: express.Response) {
	//const user = req.user as model.User
	// @ts-ignore
	//let show  = user.areasOfWork[0] === 22 || user.areasOfWork[1].toLocaleLowerCase() === 'policy';
	// TODO: Remove after testing
	const show = true
	res.send(template.render('skills/introduction', req, res, {show}))
}

export function chooseQuiz(req: express.Request, res: express.Response) {
	res.send(template.render('skills/choose-quiz', req, res))
}

export async function startQuiz(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	// @ts-ignore
	const quiz = await skillsApi.searchQuiz(user.areasOfWork[0], req.params.limit)

	quiz.questionCount = quiz.questions.length
	quiz.answers = []

	req.session!.quiz = quiz
	res.redirect(`skills/questions/${quiz.questionIndex}`)
}

export async function nextQuestion(req: express.Request, res: express.Response) {
	const index = req.params.questionIndex
	const question = req.session!.quiz.questions[index]
	const count =  req.session!.quiz.questionCount

	res.send(
		template.render('skills/questions/', req, res, {index, question, count})
	)
}

export async function answerQuestion(req: express.Request, res: express.Response) {
	let index: number = req.params.questionIndex
	// req.session!.quiz.answers[index] = req.body['choice'];
	index++
	res.redirect(`skills/questions/${index}`)
}

export async function quizSummary(req: express.Request, res: express.Response) {
	res.send(
		template.render('skills/quiz-summary', req, res, {results: []})
	)
}
