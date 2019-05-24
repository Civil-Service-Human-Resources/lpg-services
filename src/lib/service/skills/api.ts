export interface Choice {
	value: string
	type?: string
	checked?: boolean
}

export interface Question {
	type: string
	value: string
	theme: string
	why: string
	learningName: string
	learningReference: string
	choices: Choice[]
	answers: Choice[]
	correct?: boolean
}

export class Quiz {
	questions: Question[]
	questionCount?: number
	answers: any []

	constructor(questions: Question[]) {
		this.questions = questions
		this.questionCount = questions.length
		this.answers = []
	}
}
