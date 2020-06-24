import * as express from 'express'
import * as model from 'lib/model'
import * as registry from "lib/registry"
import * as skillsApi from "lib/service/skills"

import {
	Answer,
	AnswerSubmission, AreaOfWorkKeysInterface,
	Question,
	Quiz, QuizHistory,
	QuizMetadata, QuizType,
	SelectedAnswer,
	SelectedAnswers
} from "lib/service/skills/api"
import * as template from 'lib/ui/template'
import {formatAnswerSubmissionDate, saveSession} from "./helpers"

export async function introduction(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	if (!(user.areasOfWork && user.areasOfWork.length > 0) || !user.organisationalUnit!.id) {
		showQuizScreen(req, res, false)
		return
	}

	const professionId = parseInt(user.areasOfWork[0], 10)

	const quizMetadata: QuizMetadata = await skillsApi.getQuizMetadata(professionId, user)

	if (quizMetadata.numberOfQuestions === undefined || quizMetadata.numberOfQuestions < 18) {
		showQuizScreen(req, res, false)
		return
	}
	const quiz: Quiz = {
		answers: [],
		description: quizMetadata.description,
		id: quizMetadata.id,
		name: quizMetadata.name,
		numberOfQuestions: quizMetadata.numberOfQuestions,
		questions: [],
	}
	const quizExists: boolean = quiz !== null
	req.session!.quiz = quiz

	await saveSession(req)

	showQuizScreen(req, res, quizExists)
}

export function chooseQuiz(req: express.Request, res: express.Response) {
	if (!req.session!.quiz) {
			return res.redirect(`/skills`)
	}

	const requestQuiz: Quiz = req.session!.quiz
	const quizDescription = requestQuiz.description
	const questionCount = requestQuiz.numberOfQuestions
	res.send(template.render('skills/choose-quiz', req, res, {
		questionCount,
		quizDescription,
	}))
}

export async function startQuiz(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	const requestQuiz: Quiz = req.session!.quiz

	if (!(user.areasOfWork && user.areasOfWork.length > 0)) {
		showQuizScreen(req, res, false)
		return
	}
	const professionId = parseInt(user.areasOfWork[0], 10)
	// @ts-ignore
	if (!(user.areasOfWork && user.areasOfWork.length > 0)) {
		showQuizScreen(req, res, false)
		return
	}

	// @ts-ignore
	const quizType: QuizType = req.body.quizType === undefined ? QuizType.short : req.body.quizType
	let quizQuestions: Question [] = []
	if (quizType === QuizType.short) {
		quizQuestions = await skillsApi.getQuizQuestions(professionId, 18, user)
	}
	if (quizType === QuizType.long) {
		quizQuestions = await skillsApi.getQuizQuestions(professionId, 36, user)
	}
	req.session!.questions = quizQuestions
	const selectedAnswers: SelectedAnswers = {
		answers: [],
		organisationId: user.organisationalUnit!.id,
		professionId,
		quizId: requestQuiz.id,
		quizName: requestQuiz.name,
		staffId: user.id,
	}
	req.session!.selectedAnswers = selectedAnswers

	const keys = generateKeysFromAnswers(quizQuestions[0].answer.answers)

	await saveSession(req)

	res.send(
		template.render('skills/questions', req, res, {
			answersToQuestionKeys: [],
			count: quizQuestions.length,
			index: 0,
			keys,
			multipleAnswers: quizQuestions[0].type === 'MULTIPLE',
			question: quizQuestions[0],
			skipped: false,
		})
	)
}

export function generateKeysFromAnswers(answers: Answer) {
	/* tslint:disable-next-line */
	let keys = []
	for (const key of Object.keys(answers)) {
		keys.push(
			{
				value: key,
			}
		)
	}
	return keys
}

export function showQuizScreen(req: express.Request, res: express.Response, quizExists: boolean) {
	res.send(template.render('skills/introduction', req, res, {
		quizExists,
	}))
}

export async function displayQuestion(req: express.Request, res: express.Response) {
	const index: number = parseInt(req.params.questionIndex, 0)
	const selectedAnswers: SelectedAnswers = req.session!.selectedAnswers
	const requestQuestions: Question[] = req.session!.questions
	if (index > requestQuestions.length - 1 || !requestQuestions || requestQuestions.length === 0) {
		res.redirect('/skills')
		return
	}

	const selectedAnswersArray: SelectedAnswer[] = selectedAnswers
		.answers.filter(val => val.questionId === requestQuestions[index].id)

	const answersToThisQuestion = selectedAnswersArray
		.map(answer => answer.submittedAnswers)

	let skippedAnswer = false
	let answersToQuestionKeys: string[] = []
	if (answersToThisQuestion.length === 1) {
		answersToQuestionKeys = answersToThisQuestion[0]
		skippedAnswer = selectedAnswersArray[0].skipped
	}

	const keys = generateKeysFromAnswers(requestQuestions[index].answer.answers)
	res.send(
		template.render('skills/questions', req, res, {
			answersToQuestionKeys,
			count: requestQuestions.length,
			index,
			keys,
			multipleAnswers: requestQuestions[index].type === 'MULTIPLE',
			question: requestQuestions[index],
			skipped: skippedAnswer,
		})
	)
}

export async function answerQuestion(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	let index: number = parseInt(req.params.questionIndex, 0)
	const selectedAnswers: SelectedAnswers = req.session!.selectedAnswers
	const requestQuestions: Question[] = req.session!.questions

	let answersArray: string[] = Array.isArray(req.body.answers) ? req.body.answers : [req.body.answers]
	if (answersArray.length === 1 && answersArray[0] === undefined) {
		answersArray = []
	}

	const questionSkipped = answersArray.length === 0

	const selectedAnswer: SelectedAnswer = {
		questionId: requestQuestions[index].id,
		skipped: questionSkipped,
		submittedAnswers: answersArray,
	}
	const newAnswers: SelectedAnswer[] = selectedAnswers.answers
		.filter(val => val.questionId !== requestQuestions[index].id)
	newAnswers.push(selectedAnswer)
	req.session!.selectedAnswers.answers = newAnswers

	await saveSession(req)
	if (index >= requestQuestions.length - 1) {
		const selectedAnswersToSubmit: SelectedAnswers = req.session!.selectedAnswers
		const quizSubmissionId = await skillsApi.submitAnswers(selectedAnswersToSubmit, user)
		res.redirect(`/skills/summary/${quizSubmissionId}`)
		return
	}
	index++
	res.redirect(`/skills/questions/${index}`)
}

export async function quizSummary(req: express.Request, res: express.Response) {
	const index: number = parseInt(req.params.answerSubmissionId, 0)
	const user = req.user as model.User
	req.session!.questions = []
	await saveSession(req)

	try {
		const answerSubmission: AnswerSubmission = await skillsApi
			.getResultsSummary(index, user)
		res.send(
			template.render('skills/quiz-summary', req, res, {answerSubmission})
		)
	} catch (e) {
		return res.redirect(`/skills`)
	}
}

export async function quizHistory(req: express.Request, res: express.Response) {
	const user = req.user as model.User
	const quizResultHistory: QuizHistory = await skillsApi.getQuizHistory(user)

	if (quizResultHistory.quizResultDto === null) {
		quizResultHistory.quizResultDto = []
	}
	let answerSubmissions: AnswerSubmission[] = quizResultHistory.quizResultDto

	const allAreasOfWork = await registry.halNode('professions')

	/* tslint:disable-next-line */
	let areaOfWorkKeys: AreaOfWorkKeysInterface = {}

	for (const areaOfWork of allAreasOfWork) {
		const key = areaOfWork.id
		areaOfWorkKeys[key] = areaOfWork.name
	}

	answerSubmissions = formatAnswerSubmissionDate(answerSubmissions)

	res.send(
		template.render('skills/quiz-history', req, res, {answerSubmissions, areaOfWorkKeys})
	)
}
