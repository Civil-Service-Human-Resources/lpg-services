import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'

export function hashArray(courses: model.Course[], key: string) {
	const hash: Record<string, model.Course> = {}
	for (const entry of courses) {
		const hashIndex: string = (entry as any)[key]
		hash[hashIndex] = entry
	}
	return hash
}

export async function addToPlan(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const ref = req.query.ref === 'home' ? '/' : '/suggestions-for-you'
	const course = req.course
	let module
	if (course.modules.length === 1) {
		module = course.modules[0]
	}

	try {
		await xapi.record(req, course, xapi.Verb.Liked, undefined, module)
	} catch (err) {
		res.sendStatus(500)
	} finally {
		res.redirect(ref)
	}
}

export async function removeFromSuggestions(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const ref = req.query.ref === 'home' ? '/' : '/suggestions-for-you'
	const course = req.course
	let module
	if (course.modules.length === 1) {
		module = course.modules[0]
	}

	try {
		await xapi.record(req, course, xapi.Verb.Disliked, undefined, module)
	} catch (err) {
		res.sendStatus(500)
	} finally {
		res.redirect(ref)
	}
}

export async function suggestionsForYou(
	req: express.Request,
	res: express.Response
) {
	const user = req.user as model.User
	const modified = await suggestions(user)
	res.send(
		template.render('suggested', req, {
			courses: modified,
		})
	)
}

export async function suggestions(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	const suggestedLearning = (await catalog.findSuggestedLearning(user)).entries
	let learningRecord: Record<string, model.Course> = {}
	if (Object.keys(learningRecordIn).length > 0) {
		learningRecord = learningRecordIn
	} else {
		const records = await learnerRecord.getLearningRecordOf(null, user)
		learningRecord = records.length ? hashArray(records, 'id') : {}
	}

	const modified: model.Course[] = []

	for (const course of suggestedLearning) {
		const matched = learningRecord[course.id]

		if (matched && matched.record) {
			// there is a reference to the course in the learning record
			if (
				matched.record.preference !== xapi.Labels[xapi.Verb.Disliked] &&
				matched.record.preference !== xapi.Labels[xapi.Verb.Liked]
			) {
				modified.push(course)
			}
		} else {
			modified.push(course)
		}
	}
	return modified
}
