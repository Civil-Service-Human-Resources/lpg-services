import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/suggestion')

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
	const ref = req.query.ref
	const course = req.course

	let redirectTo = '/suggestions-for-you'
	switch (ref) {
		case 'home':
		case 'search':
			redirectTo = '/'
			break
	}
	try {
		await xapi.record(req, course, xapi.Verb.Liked)
		req.flash('successTitle', 'learning_added_to_plan_title')
		req.flash('successMessage', 'learning_added_to_plan_message')
		req.session!.save(() => {
			res.redirect(redirectTo)
		})
	} catch (err) {
		logger.error('Error recording xAPI statement', err)
		res.sendStatus(500)
	}
}

export async function removeFromSuggestions(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const ref = req.query.ref === 'home' ? '/' : '/suggestions-for-you'
	const course = req.course

	try {
		await xapi.record(req, course, xapi.Verb.Disliked)
	} catch (err) {
		res.sendStatus(500)
	} finally {
		res.redirect(ref)
	}
}

export async function suggestionsPage(
	req: express.Request,
	res: express.Response
) {
	const user = req.user as model.User
	const modified = await suggestions(user)
	res.send(
		template.render('suggested', req, res, {
			areasOfWork: user.areasOfWork,
			courses: modified,
			successMessage: req.flash('successMessage')[0],
			successTitle: req.flash('successTitle')[0],
		})
	)
}

export async function expandedSuggestionsPage(
	req: express.Request,
	res: express.Response
) {
	const user = req.user as model.User
	const areaOfWorktoExpand = req.params.expandedAow
	console.log(req.params)
	const modified = await suggestions(user, {}, areaOfWorktoExpand)
	res.send(
		template.render('suggested', req, res, {
			areasOfWork: user.areasOfWork,
			courses: modified,
		})
	)
}

export async function suggestions(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {},
	expand?: string
) {
	let learningRecord: Record<string, model.Course> = {}
	const courseSuggestions: model.Course[][] = []

	if (Object.keys(learningRecordIn).length > 0) {
		learningRecord = learningRecordIn
	} else {
		const records = await learnerRecord.getLearningRecord(user)
		learningRecord = records.length ? hashArray(records, 'id') : {}
	}

	const baseParams = new catalog.ApiParameters([], '', 0, 6)
	for (const aow of user.areasOfWork || []) {
		baseParams.areaOfWork = [`${aow}`]
		if (aow[0] === expand) {
			baseParams.size = 10
		}
		const suggestedGroup = (await catalog.findSuggestedLearningWithParameters(
			baseParams.serialize()
		)).results

		courseSuggestions.push(modifyCourses(suggestedGroup, learningRecord, user))
	}
	baseParams.areaOfWork = []
	baseParams.department = user.department!
	courseSuggestions.push(
		modifyCourses(
			(await catalog.findSuggestedLearningWithParameters(
				baseParams.serialize()
			)).results,
			learningRecord,
			user
		)
	)

	return courseSuggestions
}

export async function homeSuggestions(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	const areaOfWorkParams = new catalog.ApiParameters(
		user.areasOfWork || [],
		'',
		0,
		5
	).serialize()

	const departmentParams = new catalog.ApiParameters(
		[],
		user.department!,
		0,
		1
	).serialize()

	const suggestedLearning = [
		...(await catalog.findSuggestedLearningWithParameters(areaOfWorkParams))
			.results,
		...(await catalog.findSuggestedLearningWithParameters(departmentParams))
			.results,
	]

	let learningRecord: Record<string, model.Course> = {}
	if (Object.keys(learningRecordIn).length > 0) {
		learningRecord = learningRecordIn
	} else {
		const records = await learnerRecord.getLearningRecord(user)
		learningRecord = records.length ? hashArray(records, 'id') : {}
	}
	return modifyCourses(suggestedLearning, learningRecord, user)
}

export function modifyCourses(
	courses: model.Course[],
	learningRecord: Record<string, model.Course>,
	user: model.User
) {
	const modified: model.Course[] = []
	for (const course of courses) {
		const matched = learningRecord[course.id]
		if (!matched || (!matched.hasPreference() && !matched.isComplete(user))) {
			modified.push(course)
		}
	}
	return modified
}
