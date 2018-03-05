import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'

function findCourseByUID(courses: model.Course[], id: string) {
	for (const course of courses) {
		if (course.id === id) {
			return course
		}
	}
	return null
}

export async function addToPlan(req: express.Request, res: express.Response) {
	const uid = req.params.courseId
	const course = await catalog.get(uid)
	const ref = req.query.ref === 'home' ? '/' : '/suggested-for-you'

	if (course) {
		try {
			await xapi.record(req, course, xapi.Verb.Liked)
		} catch (err) {
			res.sendStatus(500)
		} finally {
			res.redirect(ref)
		}
	} else {
		res.sendStatus(500)
	}
}

export async function removeFromSuggested(
	req: express.Request,
	res: express.Response
) {
	const uid = req.params.courseId
	const course = await catalog.get(uid)
	const ref = req.query.ref === 'home' ? '/' : '/suggested-for-you'

	if (course) {
		try {
			await xapi.record(req, course, xapi.Verb.Disliked)
		} catch (err) {
			res.sendStatus(500)
		} finally {
			res.redirect(ref)
		}
	} else {
		res.sendStatus(500)
	}
}

export async function suggestedForYou(
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

export async function suggestions(user: model.User) {
	const suggestedLearning = (await catalog.findSuggestedLearning(user)).entries
	const learningRecord = await learnerRecord.getLearningRecordOf(null, user)
	const modified: model.Course[] = []

	for (const course of suggestedLearning) {
		const matched = findCourseByUID(learningRecord, course.id)
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
