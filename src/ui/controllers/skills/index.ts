import * as express from 'express'
import * as model from 'lib/model'
import * as skillsApi from "lib/service/skills"
import {Choice, Question} from "lib/service/skills/api"
import * as template from 'lib/ui/template'

export function introduction(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	// @ts-ignore
	const show  = user.areasOfWork[0] === 22 || user.areasOfWork[1].toLocaleLowerCase() === 'policy'
	res.send(template.render('skills/introduction', req, res, {show}))
}

export function chooseQuiz(req: express.Request, res: express.Response) {
	res.send(template.render('skills/choose-quiz', req, res))
}

export async function startQuiz(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	// @ts-ignore
	req.session!.quiz = await skillsApi.searchQuiz(user.areasOfWork[0], req.body.limit)
	res.redirect('/skills/questions/0')
}

export async function nextQuestion(req: express.Request, res: express.Response) {
	const index: number = parseInt(req.params.questionIndex, 0)
	if (index > req.session!.quiz.questionCount - 1) {
		res.redirect(`/skills/summary`)
	}
	const question = req.session!.quiz.questions[index]
	const count = req.session!.quiz.questionCount
	const type = getType(question.type)

	res.send(
		template.render('skills/questions', req, res, {index, question, count, type})
	)
}

export async function answerQuestion(req: express.Request, res: express.Response) {
	let index: number = req.params.questionIndex
	if (index > req.session!.quiz.questionCount - 1) {
		res.redirect(`/skills/summary`)
	}

	req.session!.quiz.answers[index] = req.body.answers
	index++
	res.redirect(`/skills/questions/${index}`)
}

export async function quizSummary(req: express.Request, res: express.Response) {
	const quiz = req.session!.quiz
	let correct: number = 0
	quiz.questions.forEach((question: Question, index: number) => {
		const type: string = getType(question.type)
		question.choices.forEach((choice: Choice) => {
			choice.type = type
			choice.checked = quiz.answers[index] && quiz.answers[index].includes(choice.value)
		})
		question.correct = getDecision(question, quiz.answers[index])
		if (question.correct) {
			correct++
		}
	})

	res.send(
		template.render('skills/quiz-summary', req, res, {correct, quiz})
	)
}

function getType(type: string) {
	return type === 'MULTIPLE' ? 'checkbox' : 'radio'
}

function getDecision(question: Question, answers: any) {
	if (!answers) {
		return false
	}
	if (question.type === 'SINGLE') {
		return answers === question.answers[0].value
	}
	if (question.answers.length !== answers.length) {
		return false
	}
	question.answers.forEach((choice: Choice) => {
		if (!answers.includes(choice.value)) {
			console.log(choice.value, answers, "returning false")
			return false
		}
	})
	return true
}
