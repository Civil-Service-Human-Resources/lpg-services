import * as express from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as learnerRecord from 'lib/learnerrecord'
import * as xapi from 'lib/xapi'

function findCourseByUID(courses: model.Course[], uid: string) {
	for (let course of courses) {
		if (course.uid === uid) {
			return course
		}
	}
	return null
}

export async function suggestions(user: model.User) {
	let suggestedLearning = (await catalog.findSuggestedLearning(user)).entries
	let learningRecord = await learnerRecord.getLearningRecordOf(null, user)
	let modified: model.Course[] = []

	for (let course of suggestedLearning) {
		let matched = findCourseByUID(learningRecord, course.uid)
		if (matched) {
			// there is a reference to the course in the learning record
			if (
				matched.preference !== xapi.Labels[xapi.Verb.Disliked] &&
				matched.preference !== xapi.Labels[xapi.Verb.Liked]
			) {
				modified.push(course)
			}
		} else {
			modified.push(course)
		}
	}

	return modified
}

export async function suggestedForYou(
	req: express.Request,
	res: express.Response
) {
	let user = req.user as model.User

	let modified = await suggestions(user)

	res.send(
		template.render('suggested', req, {
			courses: modified,
		})
	)
}

export async function removeFromSuggested(
	req: express.Request,
	res: express.Response
) {
	let uid = req.params.courseId
	let verb = 'Disliked'
	const course = await catalog.get(uid)
	const verbId = xapi.lookup(verb)

	let ref = req.query.ref === 'home' ? '/' : '/suggested-for-you'

	if (verbId && course) {
		try {
			await xapi.record(req, course, verbId)
		} catch (err) {
			res.sendStatus(500)
		} finally {
			res.redirect(ref)
		}
	} else {
		res.sendStatus(500)
	}
}

export async function addToPlan(req: express.Request, res: express.Response) {
	let uid = req.params.courseId
	let verb = 'Liked'
	const course = await catalog.get(uid)
	const verbId = xapi.lookup(verb)

	let ref = req.query.ref === 'home' ? '/' : '/suggested-for-you'

	if (verbId && course) {
		try {
			await xapi.record(req, course, verbId)
		} catch (err) {
			res.sendStatus(500)
		} finally {
			res.redirect(ref)
		}
	} else {
		res.sendStatus(500)
	}
}
