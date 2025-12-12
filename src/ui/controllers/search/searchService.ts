import * as model from '../../../lib/model'
import {Course, User} from '../../../lib/model'
import {courseSearch} from '../../../lib/service/catalog/courseCatalogueClient'
import {buildParams, typesType} from '../../../lib/service/catalog/models/courseSearchParams'
import {CourseSearchResponse} from '../../../lib/service/catalog/models/courseSearchResponse'
import {getAreasOfWork, getInterests} from '../../../lib/service/civilServantRegistry/csrsService'
import * as csrsService from '../../../lib/service/civilServantRegistry/csrsService'
import * as courseRecordClient from '../../../lib/service/cslService/courseRecord/client'
import {CourseRecord} from '../../../lib/service/cslService/models/courseRecord'
import {CourseSearchQuery} from './models/courseSearchQuery'
import {SearchFilter, Pagination, PaginationNumberedPage, SearchPageModel, SearchCourse} from './models/searchPageModel'

import * as i18n from '../../../../locale/en.json'

export async function searchForCourses(params: CourseSearchQuery, user: User, departmentHierarchyCodes: string[]) {
	const searchQuery = buildParams(params)
	const searchResults = await courseSearch(searchQuery, user, departmentHierarchyCodes)
	const courseRecords: Map<string, CourseRecord> = new Map(
		(
			await courseRecordClient.getCourseRecords(
				searchResults.results.map(r => r.id),
				user
			)
		).map((cr): [string, CourseRecord] => [cr.courseId, cr])
	)

	const formattedCourses: SearchCourse[] = getFormattedCourses(searchResults.results, courseRecords)

	const [departmentFilters, areaOfWorkFilters, interestFilters] = await Promise.all([
		getDepartmentFilters(user, params.department),
		getAreaOfWorkFilters(user, params.areaOfWork),
		getInterestsFilters(user, params.interest),
	])

	const filters = {
		showFree: params.cost !== undefined && params.cost === 'free',
		...departmentFilters,
		...areaOfWorkFilters,
		...interestFilters,
		selectedLearningTypes: Object.entries(i18n.courseTypes).map(value => {
			return {
				label: value[1],
				value: value[0],
				checked: params.courseType.includes(value[0] as typesType),
				id: value[0],
			}
		}),
	}

	const pagination = getPagination(params, searchResults)

	return new SearchPageModel(filters, params.q, formattedCourses, pagination)
}

export function getFormattedCourses(results: Course[], courseRecords: Map<string, CourseRecord>): SearchCourse[] {
	return results.map(c => {
		const record = courseRecords.get(c.id)
		let inLearningPlan = c.isRequired()
		if (record && record.state && record.state !== 'ARCHIVED') {
			inLearningPlan = !!record || c.isRequired()
		}
		return {
			costInPounds: c.getCost() || 0,
			duration: c.getDurationSeconds(),
			id: c.id,
			moduleCount: c.getModules().length,
			shortDescription: c.shortDescription,
			type: c.getType(),
			title: c.title,
			status: '',
			inLearningPlan,
		}
	})
}

export function getPagination(params: CourseSearchQuery, searchResults: CourseSearchResponse): Pagination {
	let prevLink: string | undefined
	let nextLink: string | undefined
	const numberedPages: PaginationNumberedPage[] = []
	if (searchResults.totalResults > 0) {
		const fePage = searchResults.page + 1
		const pages = Math.ceil(searchResults.totalResults / searchResults.size)
		if (fePage > 1) {
			prevLink = params.getAsUrlParams(fePage - 1)
		}
		if (pages > 1) {
			let skip = false
			let skipped = false
			for (let i = 1; i <= pages; i++) {
				skip = i > 1 && Math.abs(i - fePage) > 1 && i !== pages
				if (skip && !skipped) {
					numberedPages.push({ellipses: true})
					skipped = true
				}
				if (!skip) {
					skipped = false
					let link: string | undefined
					if (i !== fePage) {
						link = params.getAsUrlParams(i)
					}
					numberedPages.push({link, number: i})
				}
			}
		}

		if (fePage !== pages) {
			nextLink = params.getAsUrlParams(fePage + 1)
		}
	}
	return {
		nextLink,
		prevLink,
		numberedPages,
		start: searchResults.page * searchResults.size + 1,
		end: searchResults.page * searchResults.size + searchResults.results.length,
		total: searchResults.totalResults,
	}
}

async function getDepartmentFilters(
	user: model.User,
	selectedDepartmentCodes: string[]
): Promise<{otherDepartments: SearchFilter[]; userDepartment: SearchFilter}> {
	const userOrganisationalUnit = user.organisationalUnit!
	const userDepartment: SearchFilter = {
		value: userOrganisationalUnit.code,
		id: userOrganisationalUnit.code,
		checked: selectedDepartmentCodes.includes(userOrganisationalUnit.code),
		label: userOrganisationalUnit.name,
	}
	const organisationalUnits = await csrsService.getOrganisationalUnitsForSearch(user)
	const otherDepartments: SearchFilter[] = organisationalUnits
		.filter(o => o.code !== userOrganisationalUnit.code)
		.map(o => {
			const checked = selectedDepartmentCodes.includes(o.code)
			return {
				checked,
				id: o.code,
				label: o.getNameNoAbbrev(),
				value: o.code,
			}
		})
	return {userDepartment, otherDepartments}
}

async function getAreaOfWorkFilters(
	user: model.User,
	selectedAreasOfWork: string[]
): Promise<{otherAreasOfWork: SearchFilter[]; userAreasOfWork: SearchFilter[]}> {
	const profileAreasOfWork = user.getAllAreasOfWork().map(aow => aow.name)
	const userAreasOfWork: SearchFilter[] = profileAreasOfWork
		.filter(aow => aow !== "I don't know")
		.map(aow => {
			const checked = selectedAreasOfWork.includes(aow)
			return {
				checked,
				id: aow,
				value: aow,
				label: aow,
			}
		})
	const otherAreasOfWork = (await getAreasOfWork(user)).topLevelList
		.map(aow => aow.name)
		.filter(aow => aow !== "I don't know" && !profileAreasOfWork.includes(aow))
		.map(aow => {
			const checked = selectedAreasOfWork.includes(aow)
			return {
				checked,
				id: aow,
				value: aow,
				label: aow,
			}
		})
	return {otherAreasOfWork, userAreasOfWork}
}

async function getInterestsFilters(
	user: model.User,
	selectedInterests: string[]
): Promise<{
	otherInterests: SearchFilter[]
	userInterests: SearchFilter[]
}> {
	const profileInterests = (user.interests || []).map(i => i.name)
	const userInterests: SearchFilter[] = profileInterests.map(interest => {
		const checked = selectedInterests.includes(interest)
		return {
			checked,
			id: interest,
			value: interest,
			label: interest,
		}
	})
	const otherInterests = (await getInterests(user)).list
		.map(interest => interest.name)
		.filter(i => !profileInterests.includes(i))
		.map(interest => {
			const checked = selectedInterests.includes(interest)
			return {
				checked,
				id: interest,
				value: interest,
				label: interest,
			}
		})
	return {
		otherInterests,
		userInterests,
	}
}
