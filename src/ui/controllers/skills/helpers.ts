import * as express from 'express'
import {AnswerSubmission} from "lib/service/skills/api"

export async function saveSession(req: express.Request): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		req.session!.save(() => {
			resolve()
		})
	})
}

export function formatAnswerSubmissionDate(answerSubmissions: AnswerSubmission[]) {
	/* tslint:disable-next-line */
	for (let answerSubmission of answerSubmissions) {
		answerSubmission.submittedDateString = answerSubmission.completedOn[2]
			+ "/" + (answerSubmission.completedOn[1]) + "/"
			+ answerSubmission.completedOn[0]

		answerSubmission.type = answerSubmission.type.charAt(0).toUpperCase()
			+ answerSubmission.type.slice(1).toLowerCase()
	}
	return answerSubmissions
}
