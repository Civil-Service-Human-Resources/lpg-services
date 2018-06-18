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

		req.flash(
			'successTitle',
			req.__('learning_added_to_plan_title', course.title)
		)
		req.flash(
			'successMessage',
			req.__('learning_added_to_plan_message', course.title)
		)
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
	const ref =
		req.query.ref === 'home' || req.query.ref === 'search'
			? '/'
			: '/suggestions-for-you'
	const course = req.course

	try {
		await xapi.record(req, course, xapi.Verb.Disliked)
		req.flash(
			'successTitle',
			req.__('learning_removed_from_plan_title', course.title)
		)
		req.flash(
			'successMessage',
			req.__('learning_removed_from_plan_message', course.title)
		)
	} catch (err) {
		logger.error('Error recording xAPI statement', err)
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
	const interest = await suggestionsByInterest(user)

	res.send(
		template.render('suggested', req, res, {
			areasOfWork: user.areasOfWork,
			courses: modified,
			interests: interest,
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
	const modified = await suggestions(user, {}, areaOfWorktoExpand)
	res.send(
		template.render('suggested', req, res, {
			areasOfWork: user.areasOfWork,
			courses: modified,
		})
	)
}

export async function suggestionsByInterest(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	let learningRecord: Record<string, model.Course> = {}
	const courseSuggestions: Record<string, model.Course[]> = {}

	if (Object.keys(learningRecordIn).length > 0) {
		learningRecord = learningRecordIn
	} else {
		const records = await learnerRecord.getLearningRecord(user)
		learningRecord = records.length ? hashArray(records, 'id') : {}
	}

	for (const interest of user.interests || []) {
		courseSuggestions[(interest as any).name] = await getSuggestionsByInterest(
			[interest],
			6,
			learningRecord,
			user
		)
	}

	return courseSuggestions
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

	for (const aow of user.areasOfWork || []) {
		courseSuggestions.push(
			await getSuggestions(
				'',
				[aow],
				aow === expand ? 10 : 6,
				learningRecord,
				user
			)
		)
	}
	courseSuggestions.push(
		await getSuggestions(user.department!, [], 6, learningRecord, user)
	)

	return courseSuggestions
}

export async function homeSuggestions(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	let learningRecord: Record<string, model.Course> = {}
	if (Object.keys(learningRecordIn).length > 0) {
		learningRecord = learningRecordIn
	} else {
		const records = await learnerRecord.getLearningRecord(user)
		learningRecord = records.length ? hashArray(records, 'id') : {}
	}

	let areaOfWorkSuggestions = await getSuggestions(
		user.department!,
		[],
		1,
		learningRecord,
		user
	)
	let departmentSuggestions = await getSuggestions(
		'',
		user.areasOfWork || [],
		5,
		learningRecord,
		user
	)

	// If either set of suggestions is too small, try and fill up with other suggestions.
	if (areaOfWorkSuggestions.length < 1) {
		departmentSuggestions = [
			...departmentSuggestions,
			...(await getSuggestions(
				'',
				user.areasOfWork || [],
				1,
				learningRecord,
				user
			)),
		]
	} else if (departmentSuggestions.length < 5) {
		areaOfWorkSuggestions = [
			...areaOfWorkSuggestions,
			...(await getSuggestions(
				user.department!,
				[],
				5 - departmentSuggestions.length,
				learningRecord,
				user
			)),
		]
	}

	return [...areaOfWorkSuggestions, ...departmentSuggestions]
}

async function getSuggestionsByInterest(
	interests: {}[],
	count: number,
	learningRecord: Record<string, model.Course>,
	user: model.User
): Promise<model.Course[]> {
	const interestNames = interests.map(interest => (interest as any).name)
	const params = new catalog.ApiParametersByInterest(interestNames, 0, count)
	let newSuggestions: model.Course[] = []
	let hasMore = true

	while (newSuggestions.length < count && hasMore) {
		const page = await catalog.findSuggestedLearningWithParameters(
			params.serialize()
		)
		newSuggestions = newSuggestions.concat(
			modifyCourses(page.results, learningRecord, user)
		)
		hasMore = page.totalResults > page.size * (page.page + 1)
		params.page += 1
	}

	return newSuggestions.slice(0, count)
}

async function getSuggestions(
	department: string,
	areasOfWork: string[],
	count: number,
	learningRecord: Record<string, model.Course>,
	user: model.User
): Promise<model.Course[]> {
	const params = new catalog.ApiParameters(areasOfWork, department, 0, count)

	let newSuggestions: model.Course[] = []
	let hasMore = true

	while (newSuggestions.length < count && hasMore) {
		const page = await catalog.findSuggestedLearningWithParameters(
			params.serialize()
		)
		newSuggestions = newSuggestions.concat(
			modifyCourses(page.results, learningRecord, user)
		)
		hasMore = page.totalResults > page.size * (page.page + 1)
		params.page += 1
	}

	return newSuggestions.slice(0, count)
}

function modifyCourses(
	courses: model.Course[],
	learningRecord: Record<string, model.Course>,
	user: model.User
) {
	const modified: model.Course[] = []
	for (const course of courses) {
		const matched = learningRecord[course.id]
		if (
			!matched ||
			(!matched.hasPreference() &&
				!matched.isComplete(user) &&
				!matched.isStarted(user))
		) {
			modified.push(course)
		}
	}
	return modified
}
