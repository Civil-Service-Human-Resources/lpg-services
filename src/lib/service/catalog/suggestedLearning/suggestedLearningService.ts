import { Course, User } from 'lib/model'
import * as client from 'lib/service/catalog/courseCatalogueClient'

import { getFullRecord } from '../../learnerRecordAPI/courseRecord/client'
import { GetCoursesParams } from '../models/getCoursesParams'
import { Suggestion } from './suggestion'
import { SuggestionsMap } from './suggestionMap'
import { SuggestionSection } from './suggestionSection'

const DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC: number = 200
const RECORD_COUNT_TO_DISPLAY: number = 6
const I_DONT_KNOW_AOW: string = "I don't know"

export function getAreasOfWorkForUser(user: User): string[] {
	// NOTE: areasOfWork can either be an array of strings OR an array made up
	// of the [id,name] of the profession object from CSRS API
	return (user.areasOfWork || []).filter(aow => isNaN(+aow))
}

export function getOtherAreasOfWorkForUser(user: User): string[] {
	return (user.otherAreasOfWork || []).map(aow => aow.name)
}

export function getInterestsForUser(user: User): string[] {
	return (user.interests || []).map(interest => interest.name)
}

export async function fetchSuggestedLearning(user: User, departmentHierarchyCodes: string[]): Promise<SuggestionsMap> {
	const courseIdsInLearningPlan = (await getFullRecord(user)).map(c => c.courseId)

	const params = await extractSuggestionParams(user, departmentHierarchyCodes)
	const map = new SuggestionsMap()

	await Promise.all(
		params.map(async s => {
			let courses: Course[] = []
			if (s.params) {
				courses = await getSuggestions(s.params, courseIdsInLearningPlan, user)
			}
			map.addToMap(s.suggestion, s.key, courses)
		})
	)

	return map

}

export async function extractSuggestionParams(user: User, departmentHierarchyCodes: string[]) {
	const params = []
	params.push(
		...createParamsForOtherAreasOfWorkSection(departmentHierarchyCodes, user),
		...createParamsForAreaOfWorkSection(departmentHierarchyCodes, user),
		...createParamsForDepartmentSection(departmentHierarchyCodes, user),
		...createParamsForInterestsSection(departmentHierarchyCodes, user)
	)
	return params
}

export function createParamsForDepartmentSection(departmentCodes: string[], user: User): SuggestionSection[] {
	const param = {
		departments: departmentCodes.join(','),
		grade: user.getGradeCode(),
		page: 0,
		size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
	}
	return [new SuggestionSection(departmentCodes[0], Suggestion.DEPARTMENT, param)]
}

export function createParamsForAreaOfWorkSection(departmentCodes: string[], user: User): SuggestionSection[] {
	return getAreasOfWorkForUser(user).map(aow => {
		const param =
			aow !== I_DONT_KNOW_AOW
				? {
						areaOfWork: aow,
						excludeDepartments: departmentCodes,
						grade: user.getGradeCode(),
						page: 0,
						size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
				}
				: undefined
		return new SuggestionSection(aow, Suggestion.AREA_OF_WORK, param)
	})
}

export function createParamsForOtherAreasOfWorkSection(departmentCodes: string[], user: User): SuggestionSection[] {
	const otherAreasOfWork = getOtherAreasOfWorkForUser(user)
	const areasOfWork = getAreasOfWorkForUser(user)
	return otherAreasOfWork.map(areaOfWork => {
		const filteredOtherAreasOfWork = otherAreasOfWork.filter(otherAreaOfWork => areaOfWork !== otherAreaOfWork)
		const excludeAreasOfWork = [...areasOfWork, ...filteredOtherAreasOfWork]
		const param =
			areaOfWork !== I_DONT_KNOW_AOW && !areasOfWork.includes(areaOfWork)
					? {
						areaOfWork,
						excludeAreasOfWork,
						excludeDepartments: departmentCodes,
						grade: user.getGradeCode(),
						page: 0,
						size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
					}
				: undefined
		return new SuggestionSection(areaOfWork, Suggestion.OTHER_AREAS_OF_WORK, param)
	})
}

export function createParamsForInterestsSection(departmentCodes: string[], user: User): SuggestionSection[] {
	const excludeAreasOfWork = [...getAreasOfWorkForUser(user), ...getOtherAreasOfWorkForUser(user)]
	return getInterestsForUser(user).map(interest => {
		const excludeInterests = getInterestsForUser(user).filter(otherInterest => otherInterest !== interest)
		const param: GetCoursesParams = {
			excludeAreasOfWork,
			excludeDepartments: departmentCodes,
			excludeInterests,
			grade: user.getGradeCode(),
			interest,
			page: 0,
			size: DEFAULT_RECORDS_TO_SCAN_IN_ELASTIC,
		}
		return new SuggestionSection(interest, Suggestion.INTERESTS, param)
	})
}

export async function getSuggestions(
	params: GetCoursesParams,
	courseIdsInPlan: string[],
	user: User
): Promise<Course[]> {
	const newSuggestions: Course[] = []
	let hasMore = true

	while (newSuggestions.length <= RECORD_COUNT_TO_DISPLAY && hasMore) {
		const page = await client.getCoursesV2(params, user)
		page.results.map(course => {
			if (newSuggestions.length < RECORD_COUNT_TO_DISPLAY && !courseIdsInPlan.includes(course.id)) {
				newSuggestions.push(course)
			}
		})
		hasMore = page.totalResults > page.size * (page.page + 1)
		params.page += 1
	}

	return newSuggestions
}
