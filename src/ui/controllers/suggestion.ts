import * as express from 'express'
import * as extended from 'lib/extended'
import { getLogger } from 'lib/logger'
import * as model from 'lib/model'
import * as client from 'lib/service/catalog/courseCatalogueClient'
import * as template from 'lib/ui/template'

import { GetCoursesParams } from '../../lib/service/catalog/models/getCoursesParams'
import {
	createParamsForAreaOfWorkSection, createParamsForDepartmentSection,
	createParamsForInterestSection,
	createParamsForOtherAreaOfWorkSection
} from '../../lib/service/catalog/models/suggestionsParamService'
import { getOrgHierarchy } from '../../lib/service/civilServantRegistry/csrsService'
import { getFullRecord } from '../../lib/service/learnerRecordAPI/courseRecord/client'
import {
	AddCourseToLearningplanActionWorker
} from '../../lib/service/learnerRecordAPI/workers/courseRecordActionWorkers/AddCourseToLearningplanActionWorker'
import {
	RemoveCourseFromLearningplanActionWorker
} from '../../lib/service/learnerRecordAPI/workers/courseRecordActionWorkers/RemoveCourseFromLearningplanActionWorker'

const logger = getLogger('controllers/suggestion')
const RECORD_COUNT_TO_DISPLAY = 6

export function hashArray<T>(records: T[], key: string) {
	const hash: Record<string, T> = {}
	for (const entry of records) {
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
		await new AddCourseToLearningplanActionWorker(course, req.user).applyActionToLearnerRecord()

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
		await new RemoveCourseFromLearningplanActionWorker(course, req.user).applyActionToLearnerRecord()
		req.flash(
			'successTitle',
			req.__('learning_removed_from_plan_title', course.title)
		)
		req.flash(
			'successMessage',
			req.__('learning_removed_from_suggestions', course.title)
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

	const courseIdsInLearningPlan = (await getFullRecord(user)).map(c => c.courseId)
	const hierarchyCodes = (await getOrgHierarchy(user.departmentId!, user)).map(
		o => o.code
	)

	const [
		department,
		areaOfWork,
		otherAreasOfWork,
		interests,
	] = await Promise.all([
		suggestionsByDepartment(user, courseIdsInLearningPlan, hierarchyCodes),
		suggestionsByAreaOfWork(user, courseIdsInLearningPlan, hierarchyCodes),
		suggestionsByOtherAreasOfWork(user, courseIdsInLearningPlan, hierarchyCodes),
		suggestionsByInterest(user, courseIdsInLearningPlan, hierarchyCodes),
	])

	res.send(
		template.render('suggested', req, res, {
			areaOfWork,
			department,
			interests,
			otherAreasOfWork,
			successMessage: req.flash('successMessage')[0],
			successTitle: req.flash('successTitle')[0],
		})
	)
}

export async function suggestionsByInterest(
	user: model.User,
	courseIdsInLearningPlan: string[],
	departmentCodes: string[]
) {
	const courseSuggestions: Record<string, model.Course[]> = {}
	const paramsArray = createParamsForInterestSection(departmentCodes, user)

	const promises = paramsArray.map(async param => {
		courseSuggestions[param.interest! as any] = await getSuggestions(
			param,
			courseIdsInLearningPlan,
			user
		)
	})
	await Promise.all(promises)
	return courseSuggestions
}

export async function suggestionsByAreaOfWork(
	user: model.User,
	courseIdsInLearningPlan: string[],
	departmentCodes: string[]
) {
	const courseSuggestions: Record<string, model.Course[]> = {}
	const paramsArray = createParamsForAreaOfWorkSection(departmentCodes, user)

	const promises = paramsArray.map(async param => {
		if (param.areaOfWork! !== "I don't know") {
			courseSuggestions[param.areaOfWork!] = await getSuggestions(
				param,
				courseIdsInLearningPlan,
				user
			)
		}
	})
	await Promise.all(promises)
	return courseSuggestions
}

export async function suggestionsByOtherAreasOfWork(
	user: model.User,
	courseIdsInLearningPlan: string[],
	departmentCodes: string[]
) {
	const courseSuggestions: Record<string, model.Course[]> = {}
	const paramsArray = createParamsForOtherAreaOfWorkSection(departmentCodes, user)
	const promises = paramsArray.map(async param => {
		if (param.areaOfWork! !== "I don't know" || !(user.areasOfWork || []).includes(param.areaOfWork!)) {
			courseSuggestions[param.areaOfWork!] = await getSuggestions(
				param,
				courseIdsInLearningPlan,
				user
			)
		}
	})
	await Promise.all(promises)
	return courseSuggestions
}

export async function suggestionsByDepartment(
	user: model.User,
	courseIdsInLearningPlan: string[],
	departmentCodes: string[]
) {
	const courseSuggestions: Record<string, model.Course[]> = {}
	if (user.departmentId) {
		const params = createParamsForDepartmentSection(departmentCodes, user)
		courseSuggestions[user.department as any] = await getSuggestions(
			params,
			courseIdsInLearningPlan,
			user
		)
	}
	return courseSuggestions
}

async function getSuggestions(
	params: GetCoursesParams,
	courseIdsInPlan: string[],
	user: model.User
): Promise<model.Course[]> {

	const newSuggestions: model.Course[] = []
	let hasMore = true

	while (newSuggestions.length <= RECORD_COUNT_TO_DISPLAY && hasMore) {
		const page = await client.getCoursesV2(params, user)
		page.results.map(course => {
			if (newSuggestions.length < RECORD_COUNT_TO_DISPLAY
				&& !courseIdsInPlan.includes(course.id)) {
				newSuggestions.push(course)
		}})
		hasMore = page.totalResults > page.size * (page.page + 1)
		params.page += 1
	}

	return newSuggestions
}
