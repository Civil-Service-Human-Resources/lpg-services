import assert = require("assert")
import * as chai from 'chai'
import * as skillsApi from "lib/service/skills"
import * as template from 'lib/ui/template'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import {mockReq, mockRes} from 'sinon-express-mock'
import {formatAnswerSubmissionDate} from "./helpers"
import * as helper from './helpers'
import {
	answerQuestion,
	chooseQuiz,
	displayQuestion,
	generateKeysFromAnswers,
	introduction, quizHistory,
	quizSummary,
	startQuiz
} from './index'
import {
	emptyQuizHistoryResponse,
	expectedAreasOfWork,
	expectedQuizHistoryResponse,
	expectedResultSummaryResponse,
	generateSelectedAnswers,
	QuizQuestions18,
	QuizQuestions36
} from "./index.fixture"

chai.use(sinonChai)

describe('Skills middleware', () => {

	describe('Introduction page', () => {
		it('User has no areas of work, not shown any quiz', async () => {
			const request = {
				originalUrl: '/home',
				user: {
					areasOfWork: [
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			await introduction(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/introduction', req, res, {
				quizExists: false,
			}))
			assert(templateStub.calledOnce)

			templateStub.restore()
			helperStub.restore()
		})

		it('No quiz metadata available for current profession, not shown any quiz', async () => {
			const request = {
				originalUrl: '/home',
				user: {
					areasOfWork: [
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const apiStub = sinon.stub(skillsApi, 'getQuizMetadata').returns(null)

			await introduction(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/introduction', req, res, {
				quizExists: false,
			}))
			assert(templateStub.calledOnce)

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

		it('Getting quiz metadata returns quiz with 17 questions, not shown any quiz', async () => {
			const request = {
				originalUrl: '/home',
				user: {
					areasOfWork: [
							1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const apiStub = sinon.stub(skillsApi, 'getQuizMetadata').returns(
				{
					description: 'desc',
					id: 1,
					name: 'name',
					numberOfQuestions: 17,
					status: 'DRAFT',
				}
			)

			await introduction(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/introduction', req, res, {
				quizExists: false,
			}))
			assert(templateStub.calledOnce)

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

		it('Getting quiz metadata returns quiz with no questions, not shown any quiz', async () => {
			const request = {
				originalUrl: '/home',
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const apiStub = sinon.stub(skillsApi, 'getQuizMetadata').returns(
				{
					description: 'desc',
					id: 1,
					name: 'name',
					numberOfQuestions: 0,
					status: 'DRAFT',
				}
			)

			await introduction(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/introduction', req, res, {
				quizExists: false,
			}))
			assert(templateStub.calledOnce)

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

		it('Getting quiz metadata returns quiz with 18 questions, shown quiz', async () => {
			const request = {
				originalUrl: '/home',
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const quiz = {
				description: 'desc',
				id: 1,
				name: 'name',
				numberOfQuestions: 18,
				status: 'DRAFT',
			}

			const apiStub = sinon.stub(skillsApi, 'getQuizMetadata').returns(quiz)

			await introduction(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/introduction', req, res, {
				quizExists: true,
			}))
			assert(templateStub.calledOnce)
			assert(JSON.stringify(req.session!.quiz) === JSON.stringify({
				answers: [],
				description: quiz.description,
				id: quiz.id,
				name: quiz.name,
				numberOfQuestions: quiz.numberOfQuestions,
				questions: [],
			}))

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

		it('Getting quiz metadata returns quiz with 29 questions, shown quiz', async () => {
			const request = {
				originalUrl: '/home',
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const quiz = {
				description: 'desc',
				id: 1,
				name: 'name',
				numberOfQuestions: 29,
				status: 'DRAFT',
			}

			const apiStub = sinon.stub(skillsApi, 'getQuizMetadata').returns(quiz)

			await introduction(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/introduction', req, res, {
				quizExists: true,
			}))
			assert(templateStub.calledOnce)
			assert(JSON.stringify(req.session!.quiz) === JSON.stringify({
				answers: [],
				description: quiz.description,
				id: quiz.id,
				name: quiz.name,
				numberOfQuestions: quiz.numberOfQuestions,
				questions: [],
			}))
			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

	})

	describe('Choose a quiz page', () => {
		it('No quiz in session, redirects to introduction page', async () => {
			const request = {
				originalUrl: '/home',
				session: {
				},
				user: {
					areasOfWork: [
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			await chooseQuiz(req, res)

			assert(res.redirect.callCount === 1)
			assert(res.redirect.args[0][0] === '/skills')
		})

		it('Redirects to correct page', async () => {
			const sessionQuiz = {
				answers: [],
					description: 'description',
					id: 1,
					name: 'quiz name',
					numberOfQuestions: 21,
					questions: [],
			}

			const request = {
				originalUrl: '/home',
				session: {
					quiz: sessionQuiz,
				},
				user: {
					areasOfWork: [
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const templateStub = sinon.stub(template, 'render').returns(null)

			await chooseQuiz(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/choose-quiz', req, res, {
				questionCount: sessionQuiz.numberOfQuestions,
				quizDescription: sessionQuiz.description,
			}))
			assert(templateStub.calledOnce)

			templateStub.restore()
		})
	})

	describe('Start a quiz', () => {
		it('User has no areas of work, not shown any quiz', async () => {
			const request = {
				originalUrl: '/home',
				user: {
					areasOfWork: [
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const templateStub = sinon.stub(template, 'render').returns(null)

			await startQuiz(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/introduction', req, res, {
				quizExists: false,
			}))
			assert(templateStub.calledOnce)

			templateStub.restore()
		})

		it('Short quiz selected, starting quiz', async () => {
			const sessionQuiz = {
				answers: [],
				description: 'description',
				id: 1,
				name: 'quiz name',
				numberOfQuestions: 21,
				questions: [],
			}

			const request = {
				body: {
					quizType: 'short',
				},
				originalUrl: '/home',
				session: {
					quiz: sessionQuiz,
				},
				user: {
					areasOfWork: [
							1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					id: '123',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const quizQuestions = QuizQuestions18

			const apiStub = sinon.stub(skillsApi, 'getQuizQuestions').returns(quizQuestions)

			await startQuiz(req, res)
			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/questions', req, res, {
				answersToQuestionKeys: [],
				count: quizQuestions.length,
				index: 0,
				keys: generateKeysFromAnswers(quizQuestions[0].answer.answers),
				multipleAnswers: quizQuestions[0].type === 'MULTIPLE',
				question: quizQuestions[0],
				skipped: false,
			}))
			assert(templateStub.calledOnce)
			assert(JSON.stringify(req.session!.selectedAnswers) === JSON.stringify({
				answers: [],
				organisationId: 1,
				professionId: 1,
				quizId: sessionQuiz.id,
				quizName: sessionQuiz.name,
				staffId: '123',
			}))
			assert(JSON.stringify(req.session!.questions) === JSON.stringify(quizQuestions))

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

		it('Long quiz selected, starting quiz', async () => {
			const sessionQuiz = {
				answers: [],
				description: 'description',
				id: 1,
				name: 'quiz name',
				numberOfQuestions: 21,
				questions: [],
			}

			const request = {
				body: {
					quizType: 'long',
				},
				originalUrl: '/home',
				session: {
					quiz: sessionQuiz,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					id: '123',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const quizQuestions = QuizQuestions36

			const apiStub = sinon.stub(skillsApi, 'getQuizQuestions').returns(quizQuestions)

			await startQuiz(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/questions', req, res, {
				answersToQuestionKeys: [],
				count: quizQuestions.length,
				index: 0,
				keys: generateKeysFromAnswers(quizQuestions[0].answer.answers),
				multipleAnswers: quizQuestions[0].type === 'MULTIPLE',
				question: quizQuestions[0],
				skipped: false,
			}))
			assert(templateStub.calledOnce)
			assert(JSON.stringify(req.session!.selectedAnswers) === JSON.stringify({
				answers: [],
				organisationId: 1,
				professionId: 1,
				quizId: sessionQuiz.id,
				quizName: sessionQuiz.name,
				staffId: '123',
			}))
			assert(JSON.stringify(req.session!.questions) === JSON.stringify(quizQuestions))

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

		it('No Type quiz selected, starting short quiz', async () => {
			const sessionQuiz = {
				answers: [],
				description: 'description',
				id: 1,
				name: 'quiz name',
				numberOfQuestions: 21,
				questions: [],
			}

			const request = {
				body: {
				},
				originalUrl: '/home',
				session: {
					quiz: sessionQuiz,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					id: '123',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const quizQuestions = QuizQuestions18

			const apiStub = sinon.stub(skillsApi, 'getQuizQuestions').returns(quizQuestions)

			await startQuiz(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/questions', req, res, {
				answersToQuestionKeys: [],
				count: quizQuestions.length,
				index: 0,
				keys: generateKeysFromAnswers(quizQuestions[0].answer.answers),
				multipleAnswers: quizQuestions[0].type === 'MULTIPLE',
				question: quizQuestions[0],
				skipped: false,
			}))
			assert(templateStub.calledOnce)
			assert(JSON.stringify(req.session!.selectedAnswers) === JSON.stringify({
				answers: [],
				organisationId: 1,
				professionId: 1,
				quizId: sessionQuiz.id,
				quizName: sessionQuiz.name,
				staffId: '123',
			}))
			assert(JSON.stringify(req.session!.questions) === JSON.stringify(quizQuestions))

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})
	})

	describe('Display a question', () => {
		it('Current question index is more than quiz questions, redirects to summary', async () => {
			const request = {
				originalUrl: '/home',
				params: {
					questionIndex: 20,
				},
				session: {
					questions: QuizQuestions18,
				},
				user: {
					areasOfWork: [
							1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			await displayQuestion(req, res)

			assert(res.redirect.callCount === 1)
			assert(res.redirect.args[0][0] === '/skills')
		})

		it('Current question is first in quiz, not populated', async () => {
			const questionIndex = 0
			const request = {
				originalUrl: '/home',
				params: {
					questionIndex,
				},
				session: {
					questions: QuizQuestions18,
					selectedAnswers: {
						answers: [],
					},
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const templateStub = sinon.stub(template, 'render').returns(null)

			await displayQuestion(req, res)

			assert(templateStub.calledWith('skills/questions', req, res, {
				answersToQuestionKeys: [],
				count: QuizQuestions18.length,
				index: questionIndex,
				keys: generateKeysFromAnswers(QuizQuestions18[questionIndex].answer.answers),
				multipleAnswers: QuizQuestions18[questionIndex].type === 'MULTIPLE',
				question: QuizQuestions18[questionIndex],
				skipped: false,
			}))
			templateStub.restore()
		})

		it('Current question was already populated before, shows question prepopulated', async () => {
			const questionIndex = 5
			const selectedAnswersExisting = generateSelectedAnswers(6)
			const request = {
				originalUrl: '/home',
				params: {
					questionIndex,
				},
				session: {
					questions: QuizQuestions18,
					selectedAnswers: selectedAnswersExisting,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const templateStub = sinon.stub(template, 'render').returns(null)

			await displayQuestion(req, res)

			assert(templateStub.calledWith('skills/questions', req, res, {
				answersToQuestionKeys: selectedAnswersExisting.answers[0].submittedAnswers,
				count: QuizQuestions18.length,
				index: questionIndex,
				keys: generateKeysFromAnswers(QuizQuestions18[questionIndex].answer.answers),
				multipleAnswers: QuizQuestions18[questionIndex].type === 'MULTIPLE',
				question: QuizQuestions18[questionIndex],
				skipped: false,
			}))
			templateStub.restore()
		})

		it('Current question was skipped before, marked as a skipped question', async () => {
			const questionIndex = 5
			const selectedAnswersExisting = generateSelectedAnswers(6)
			selectedAnswersExisting.answers[0].skipped = true
			const request = {
				originalUrl: '/home',
				params: {
					questionIndex,
				},
				session: {
					questions: QuizQuestions18,
					selectedAnswers: selectedAnswersExisting,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const templateStub = sinon.stub(template, 'render').returns(null)

			await displayQuestion(req, res)

			assert(templateStub.calledWith('skills/questions', req, res, {
				answersToQuestionKeys: selectedAnswersExisting.answers[0].submittedAnswers,
				count: QuizQuestions18.length,
				index: questionIndex,
				keys: generateKeysFromAnswers(QuizQuestions18[questionIndex].answer.answers),
				multipleAnswers: QuizQuestions18[questionIndex].type === 'MULTIPLE',
				question: QuizQuestions18[questionIndex],
				skipped: true,
			}))
			templateStub.restore()
		})

	})

	describe('Answer a question', () => {

		it('Single answer is selected, saves single answer and redirects to next question', async () => {
			const questionIndex = 5
			const selectedAnswersExisting = generateSelectedAnswers(6)
			const request = {
				body: {
					answers: "A",
				},
				originalUrl: '/home',
				params: {
					questionIndex,
				},
				session: {
					questions: QuizQuestions18,
					selectedAnswers: selectedAnswersExisting,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			await answerQuestion(req, res)

			assert(res.redirect.callCount === 1)
			assert(res.redirect.args[0][0] === '/skills/questions/6')

			assert(JSON.stringify(req.session!.selectedAnswers.answers) ===
				JSON.stringify([ { questionId: questionIndex + 1, skipped: false, submittedAnswers: [ 'A' ] } ]))
			templateStub.restore()
			helperStub.restore()
		})

		it('Multiple answers are selected, saves multiple answers and redirects to next question', async () => {
			const questionIndex = 5
			const selectedAnswersExisting = generateSelectedAnswers(6)
			const request = {
				body: {
					answers: ["A", "B", "C"],
				},
				originalUrl: '/home',
				params: {
					questionIndex,
				},
				session: {
					questions: QuizQuestions18,
					selectedAnswers: selectedAnswersExisting,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			await answerQuestion(req, res)

			assert(res.redirect.callCount === 1)
			assert(res.redirect.args[0][0] === '/skills/questions/6')

			assert(JSON.stringify(req.session!.selectedAnswers.answers) ===
				JSON.stringify([ { questionId: questionIndex + 1, skipped: false, submittedAnswers: [ 'A', 'B', 'C' ] } ]))
			templateStub.restore()
			helperStub.restore()
		})

		it('User skips question, marked as skip and redirects to next question', async () => {
			const questionIndex = 5
			const selectedAnswersExisting = generateSelectedAnswers(6)
			const request = {
				body: {
					answers: undefined,
				},
				originalUrl: '/home',
				params: {
					questionIndex,
				},
				session: {
					questions: QuizQuestions18,
					selectedAnswers: selectedAnswersExisting,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			await answerQuestion(req, res)

			assert(res.redirect.callCount === 1)
			assert(res.redirect.args[0][0] === '/skills/questions/6')

			assert(JSON.stringify(req.session!.selectedAnswers.answers) ===
				JSON.stringify([ { questionId: questionIndex + 1, skipped: true, submittedAnswers: [] } ]))
			templateStub.restore()
			helperStub.restore()
		})

		it('Last question in quiz, answers are submitted and redirects to result summary', async () => {
			const questionIndex = 17
			const selectedAnswersExisting = generateSelectedAnswers(6)
			const request = {
				body: {
					answers: undefined,
				},
				originalUrl: '/home',
				params: {
					questionIndex,
				},
				session: {
					questions: QuizQuestions18,
					selectedAnswers: selectedAnswersExisting,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const newResultId = 144
			const apiStub = sinon.stub(skillsApi, 'submitAnswers').returns(newResultId)

			await answerQuestion(req, res)

			assert(res.redirect.callCount === 1)
			assert(res.redirect.args[0][0] === `/skills/summary/${newResultId}`)

			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

	})

	describe('Display quiz summary', () => {

		it('Backend throws error when requesting result summary, redirected to main skills page', async () => {
			const answerSubmissionId = 1
			const request = {
				originalUrl: '/home',
				params: {
					answerSubmissionId,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const apiStub = sinon.stub(skillsApi, 'getResultsSummary').throwsException('error')

			await quizSummary(req, res)

			assert(res.redirect.callCount === 1)
			assert(res.redirect.args[0][0] === '/skills')
			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

		it('Backend returns results summary, correct data is passed to page', async () => {
			const answerSubmissionId = 1
			const request = {
				originalUrl: '/home',
				params: {
					answerSubmissionId,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const helperStub = sinon.stub(helper, 'saveSession').returns(Promise.resolve())

			const templateStub = sinon.stub(template, 'render').returns(null)

			const apiStub = sinon.stub(skillsApi, 'getResultsSummary').returns(expectedResultSummaryResponse)

			await quizSummary(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/quiz-summary', req, res, {answerSubmission: expectedResultSummaryResponse}))
			assert(templateStub.calledOnce)
			templateStub.restore()
			apiStub.restore()
			helperStub.restore()
		})

	})

	describe('Display quiz history', () => {

		it('Backend returns data, displays quiz history', async () => {
			const answerSubmissionId = 1
			const request = {
				originalUrl: '/home',
				params: {
					answerSubmissionId,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const templateStub = sinon.stub(template, 'render').returns(null)

			const apiStub = sinon.stub(skillsApi, 'getQuizHistory').returns(expectedQuizHistoryResponse)

			await quizHistory(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/quiz-history', req, res, {
				answerSubmissions: formatAnswerSubmissionDate(expectedQuizHistoryResponse.quizResultDto),
				areaOfWorkKeys: expectedAreasOfWork,
			}))
			assert(templateStub.calledOnce)
			templateStub.restore()
			apiStub.restore()
		})

		it('Backend returns data, displays quiz history', async () => {
			const answerSubmissionId = 1
			const request = {
				originalUrl: '/home',
				params: {
					answerSubmissionId,
				},
				user: {
					areasOfWork: [
						1, 'Analysis',
					],
					department: 'co',
					givenName: 'Test User',
					organisationalUnit: {
						code: 'co',
						id: 1,
						name: 'Cabinet Office',
						paymentMethods: [],
					},
					otherAreasOfWork: [
						{
							id: 2,
							name: 'Commercial',
						},
					],
				},
			}
			const req = mockReq(request)
			const res = mockRes()

			const templateStub = sinon.stub(template, 'render').returns(null)

			const apiStub = sinon.stub(skillsApi, 'getQuizHistory').returns(emptyQuizHistoryResponse)

			await quizHistory(req, res)

			assert(res.send.callCount === 1)
			assert(templateStub.calledWith('skills/quiz-history', req, res, {
				answerSubmissions: formatAnswerSubmissionDate([]),
				areaOfWorkKeys: expectedAreasOfWork,
			}))
			assert(templateStub.calledOnce)
			templateStub.restore()
			apiStub.restore()
		})

	})
})
