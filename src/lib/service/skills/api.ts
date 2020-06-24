export interface Choice {
	value: string
	type?: string
	checked?: boolean
	questionLetter: string
}

export interface AnswerSubmission {
	id: number
	staffId: string
	professionId: number
	type: string
	numberOfQuestions: number
	correctAnswers: number
	answers?: SelectedAnswer[]
	submittedDateString?: string
	quizId: number
	result: string
	completedOn: number[]
	score: number
	quizName: string
	learningName: string
	learningReference: string
	why: string
}

export interface QuizHistory {
	quizResultDto: AnswerSubmission[]
}

export enum QuizType {
	short = 'short',
	long = 'long',
}

export interface QuizMetadata {
	id: number
	name: string
	status: string
	numberOfQuestions: number
	description: string
}
export interface SelectedAnswers {
	quizId: number
	staffId: string
	professionId: number
	answers: SelectedAnswer[]
	quizName: string
	organisationId: number
}

export interface SelectedAnswer {
	questionId: number
	submittedAnswers: string[]
	skipped: boolean,
	question?: Question,
	correct?: boolean
}

export interface Answer {
	[name: string]: string
}

export interface Answers {
	answers: Answer,
}

export interface Question {
	alternativeText: string
	id: number
	type?: string
	value: string
	theme?: string
	why?: string
	learningName?: string
	learningReference?: string
	imgUrl?: string
	suggestions?: string
	answer: {
		id: number
		correctAnswer: string []
		answers: Answer,
	}
	status: string
}

export class Quiz {
	id: number
	name: string
	questions: Question[]
	numberOfQuestions: number
	answers: any []
	description: string

	constructor(questions: Question[]) {
		this.questions = questions
		this.numberOfQuestions = questions.length
		this.answers = []
	}
}

export interface AreaOfWorkKeysInterface {
	[key: string]: any
}
