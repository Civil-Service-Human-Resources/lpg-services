import {AnswerSubmission, Question, QuizHistory, SelectedAnswers} from '../../../lib/service/skills/api'

export function generateSelectedAnswers(questionId: number): SelectedAnswers {
	return {
		answers: [
			{
				questionId: 6,
				skipped: false,
				submittedAnswers: ['A', 'C'],
			},
		],
		organisationId: 1,
		professionId: 1,
		quizId: 1,
		quizName: 'quizName',
		staffId: '555',
	}
}

export const QuizQuestions18: Question[] = [
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 1,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of UK?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 2,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 3,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 4,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 5,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 6,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 7,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 8,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 9,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 10,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 11,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 12,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 13,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 14,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 15,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 16,
		status: 'ACTIVE',
		type: 'MULTIPLE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 17,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 18,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
]

export const QuizQuestions36: Question[] = [
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 1,
		status: 'ACTIVE',
		value: 'What is the capital of UK?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 2,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 3,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 4,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 5,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 6,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 7,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 8,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 9,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 10,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 11,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 12,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 13,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 14,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 15,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 16,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 17,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 18,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 19,
		status: 'ACTIVE',
		value: 'What is the capital of UK?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 20,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 21,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 22,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 23,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 24,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 25,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 26,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 27,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 28,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 29,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 30,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 31,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 32,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 33,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 34,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 35,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
	{
		alternativeText: 'Alternative text',
		answer: {
			answers: {
				a: 'Answer A',
				b: 'Answer B',
				c: 'Answer C',
			},
			correctAnswer: ['D'],
			id: 11,
		},
		id: 36,
		status: 'ACTIVE',
		value: 'What is the capital of USA?',
	},
]

export const expectedResultSummaryResponse: AnswerSubmission = {
	answers: [
		{
			correct: true,
			question: {
				alternativeText: 'Alternative text',
				answer: {
					answers: {
						a: 'Answer A',
						b: 'Answer B',
						c: 'Answer C',
					},
					correctAnswer: ['D'],
					id: 11,
				},
				id: 1,
				status: 'ACTIVE',
				type: 'MULTIPLE',
				value: 'What is the capital of UK?',
			},
			questionId: 1,
			skipped: false,
			submittedAnswers: ['D'],
		},
		{
			correct: true,
			question: {
				alternativeText: 'Alternative text',
				answer: {
					answers: {
						a: 'Answer A',
						b: 'Answer B',
						c: 'Answer C',
					},
					correctAnswer: ['D'],
					id: 11,
				},
				id: 1,
				status: 'ACTIVE',
				type: 'MULTIPLE',
				value: 'What is the capital of UK?',
			},
			questionId: 1,
			skipped: false,
			submittedAnswers: ['D'],
		},
		{
			correct: true,
			question: {
				alternativeText: 'Alternative text',
				answer: {
					answers: {
						a: 'Answer A',
						b: 'Answer B',
						c: 'Answer C',
					},
					correctAnswer: ['D'],
					id: 11,
				},
				id: 1,
				status: 'ACTIVE',
				type: 'MULTIPLE',
				value: 'What is the capital of UK?',
			},
			questionId: 1,
			skipped: false,
			submittedAnswers: ['D'],
		},
		{
			correct: true,
			question: {
				alternativeText: 'Alternative text',
				answer: {
					answers: {
						a: 'Answer A',
						b: 'Answer B',
						c: 'Answer C',
					},
					correctAnswer: ['D'],
					id: 11,
				},
				id: 1,
				status: 'ACTIVE',
				type: 'MULTIPLE',
				value: 'What is the capital of UK?',
			},
			questionId: 1,
			skipped: false,
			submittedAnswers: ['D'],
		},
	],
	completedOn: [],
	correctAnswers: 4,
	id: 1,
	learningName: 'Learning Name',
	learningReference: 'Reference',
	numberOfQuestions: 18,
	professionId: 1,
	quizId: 1,
	quizName: 'name',
	result: '',
	score: 5,
	staffId: '123',
	type: 'SHORT',
	why: 'Reason why',
}

export const expectedQuizHistoryResponse: QuizHistory = {
	quizResultDto: [
		{
			completedOn: [],
			correctAnswers: 4,
			id: 1,
			learningName: 'Learning Name',
			learningReference: 'Reference',
			numberOfQuestions: 18,
			professionId: 1,
			quizId: 1,
			quizName: 'name',
			result: '',
			score: 5,
			staffId: '123',
			type: 'SHORT',
			why: 'Reason why',
		},
	],
}

export const emptyQuizHistoryResponse: QuizHistory = {
	quizResultDto: [],
}

export const expectedAreasOfWork = new Map<number, string>([
	[1, 'Analysis'],
	[2, 'Commercial'],
	[3, 'Communications'],
	[4, 'Corporate finance'],
	[5, 'Digital'],
	[6, 'Finance'],
	[7, 'Fraud, error, debt and grants'],
	[8, 'Human resources'],
	[9, 'Internal audit'],
	[10, 'Legal'],
	[11, 'Operational delivery'],
	[12, 'Project delivery'],
	[13, 'Property'],
	[14, 'Policy'],
	[15, "I don't know"],
	[16, 'Strategy and Policy Development'],
	[17, 'Business Needs and Sourcing'],
	[18, 'Procurement'],
	[19, 'Contract and Supplier Management'],
	[20, 'Category Management'],
	[21, 'Commercial Strategy'],
	[22, 'Market Maker & Supplier Engagement'],
	[23, 'Commercial Risk and Assurance Specialist'],
	[24, 'Commercial Policy Advisor'],
	[25, 'Commercial Support'],
	[26, 'Associate Commercial Practitioner'],
	[27, 'Commercial Practitioner'],
	[28, 'Commercial Lead'],
	[29, 'Associate Commercial Specialist'],
	[30, 'Commercial Specialist'],
	[31, 'Senior Commercial Specialist'],
])

export const areasOfWorkRegistryHalMock = [
	{
		id: 1,
		name: 'Analysis',
	},
	{
		id: 2,
		name: 'Commercial',
	},
	{
		id: 3,
		name: 'Communications',
	},
	{
		id: 4,
		name: 'Corporate finance',
	},
	{
		id: 5,
		name: 'Digital',
	},
	{
		id: 6,
		name: 'Finance',
	},
	{
		id: 7,
		name: 'Fraud, error, debt and grants',
	},
	{
		id: 8,
		name: 'Human resources',
	},
	{
		id: 9,
		name: 'Internal audit',
	},
	{
		id: 10,
		name: 'Legal',
	},
	{
		id: 11,
		name: 'Operational delivery',
	},
	{
		id: 12,
		name: 'Project delivery',
	},
	{
		id: 13,
		name: 'Property',
	},
	{
		id: 14,
		name: 'Policy',
	},
	{
		id: 15,
		name: "I don't know",
	},
	{
		id: 16,
		name: 'Strategy and Policy Development',
	},
	{
		id: 17,
		name: 'Business Needs and Sourcing',
	},
	{
		id: 18,
		name: 'Procurement',
	},
	{
		id: 19,
		name: 'Contract and Supplier Management',
	},
	{
		id: 20,
		name: 'Category Management',
	},
	{
		id: 21,
		name: 'Commercial Strategy',
	},
	{
		id: 22,
		name: 'Market Maker & Supplier Engagement',
	},
	{
		id: 23,
		name: 'Commercial Risk and Assurance Specialist',
	},
	{
		id: 24,
		name: 'Commercial Policy Advisor',
	},
	{
		id: 25,
		name: 'Commercial Support',
	},
	{
		id: 26,
		name: 'Associate Commercial Practitioner',
	},
	{
		id: 27,
		name: 'Commercial Practitioner',
	},
	{
		id: 28,
		name: 'Commercial Lead',
	},
	{
		id: 29,
		name: 'Associate Commercial Specialist',
	},
	{
		id: 30,
		name: 'Commercial Specialist',
	},
	{
		id: 31,
		name: 'Senior Commercial Specialist',
	},
]
