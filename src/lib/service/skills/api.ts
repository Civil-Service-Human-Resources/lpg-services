export interface Profession {
	id: number
}

export interface Choice {
	value: string
}

export interface Question {
	type: string
	value: string
	learningName: string
	learningReference: string
	choices: Choice[]
}

export interface Quiz {
	profession: Profession
	questions: Question[]
	questionCount?: number
	answers?: any []
}
