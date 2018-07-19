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
		req.flash('successId', course.id)
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
	const courses = []

	const learningRecord = await getLearningRecord(user)

	const [areaOfWork, otherAreasOfWork, departments, interests] = await Promise.all([
		suggestionsByAreaOfWork(user, learningRecord),
		suggestionsByOtherAreasOfWork(user, learningRecord),
		suggestionsByDepartment(user, learningRecord),
		suggestionsByInterest(user, learningRecord),
	])

	courses.push({key: 'areaOfWork', value: areaOfWork })
	courses.push({key: 'areaOfWork', value: otherAreasOfWork })
	courses.push({key: 'department', value: departments })
	courses.push({key: 'interest', value: interests })

	res.send(
		template.render('suggested', req, res, {
			courses,
			successMessage: req.flash('successMessage')[0],
			successTitle: req.flash('successTitle')[0],
		})
	)
}

export async function getLearningRecord(user: model.User, learningRecordIn: Record<string, model.Course> = {}) {
	let learningRecord: Record<string, model.Course> = {}

	if (Object.keys(learningRecordIn).length > 0) {
		learningRecord = learningRecordIn
	} else {
		const records = await learnerRecord.getLearningRecord(user)
		learningRecord = records.length ? hashArray(records, 'id') : {}
	}

	return learningRecord
}

export async function suggestionsByInterest(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	const courseSuggestions: Record<string, model.Course[]> = {}

	const promises = (user.interests || []).map(async interest => {
		courseSuggestions[(interest as any)] =
			await getSuggestions(
				'',
				[],
				[interest],
				6,
				await getLearningRecord(user, learningRecordIn),
				user
			)
	})
	await Promise.all(promises)
	return courseSuggestions
}

export async function suggestionsByAreaOfWork(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	const courseSuggestions: Record<string, model.Course[]> = {}

	const promises = (user.areasOfWork || []).map(async aow => {
		courseSuggestions[(aow as any)] =
			await getSuggestions(
				'',
				[aow],
				[],
				6,
				await getLearningRecord(user, learningRecordIn),
				user
			)
	})
	await Promise.all(promises)
	return courseSuggestions
}

export async function suggestionsByOtherAreasOfWork(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	const courseSuggestions: Record<string, model.Course[]> = {}

	const promises = (user.otherAreasOfWork || []).map(async aow => {
		courseSuggestions[(aow.name as any)] =
			await getSuggestions(
				'',
				[aow.name],
				[],
				6,
				await getLearningRecord(user, learningRecordIn),
				user
			)
	})
	await Promise.all(promises)
	return courseSuggestions
}

export async function suggestionsByDepartment(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	const courseSuggestions: Record<string, model.Course[]> = {}

	courseSuggestions[(user.department as any)] =
		await getSuggestions(
			user.department!,
			[],
			[],
			6,
			await getLearningRecord(user, learningRecordIn),
			user
		)
	return courseSuggestions
}

export async function homeSuggestions(
	user: model.User,
	learningRecordIn: Record<string, model.Course> = {}
) {
	const learningRecord = await getLearningRecord(user, learningRecordIn)
	return await getSuggestions(
		user.department!,
		user.areasOfWork || [],
		[],
		6,
		learningRecord,
		user
	)
}

async function getSuggestions(
	department: string,
	areasOfWork: string[],
	interests: string[],
	count: number,
	learningRecord: Record<string, model.Course>,
	user: model.User
): Promise<model.Course[]> {
	const params = new catalog.ApiParameters(areasOfWork, department, interests, 0, count)

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
