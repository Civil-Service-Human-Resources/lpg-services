import * as model from '../../../lib/model'
import {User} from '../../../lib/model'
import {courseSearch} from '../../../lib/service/catalog/courseCatalogueClient'
import {buildParams} from '../../../lib/service/catalog/models/courseSearchParams'
import {CourseSearchResponse} from '../../../lib/service/catalog/models/courseSearchResponse'
import {getAreasOfWork, getInterests} from '../../../lib/service/civilServantRegistry/csrsService'
import * as csrsService from '../../../lib/service/civilServantRegistry/csrsService'
import * as courseRecordClient from '../../../lib/service/learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../../../lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {CourseSearchQuery} from './models/courseSearchQuery'
import {FilterBox, OrgFilterBox, Pagination, PaginationNumberedPage, SearchPageModel} from './models/searchPageModel'

export async function searchForCourses(params: CourseSearchQuery, user: User) {
	const searchQuery = buildParams(params)
	const searchResults = await courseSearch(searchQuery, user)
	const courseRecords: Map<string, CourseRecord> = new Map(
		(
			await courseRecordClient.getCourseRecords(
				searchResults.results.map(r => r.id),
				user
			)
		).map((cr): [string, CourseRecord] => [cr.courseId, cr])
	)

	searchResults.results.forEach(course => {
		course.record = courseRecords.get(course.id)
	})

	const [departmentData, areasOfWorkData, interestsData] = await Promise.all([
		getDepartmentData(user, params.department),
		getAreasOfWorkData(user, params.areaOfWork),
		getInterestsData(user, params.interest),
	])

	const pagination = getPagination(params, searchResults)

	return new SearchPageModel(
		areasOfWorkData,
		departmentData,
		interestsData,
		params.courseType,
		params.q,
		searchResults.results,
		pagination,
		params.cost
	)
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
			for (let i = 1; i <= pages; i++) {
				let link: string | undefined
				if (i !== fePage) {
					link = params.getAsUrlParams(i)
				}
				numberedPages.push({link, number: i})
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

async function getDepartmentData(user: model.User, selectedDepartmentCodes: string[]): Promise<OrgFilterBox> {
	const allDepartments = (await csrsService.getAllOrganisationUnits(user)).typeahead
	const yourDepartment = user.organisationalUnit!
	/**
	 * NOTE: 20221117 - the code below will sort/slice the department list based on ID. This is to
	 * replicate the current functionality of only showing the first 20 departments, in order of
	 * ID.
	 */
	const selectedDepartments: string[] = allDepartments
		.filter(o => selectedDepartmentCodes.includes(o.code))
		.map(o => o.code)
	const otherDepartments = allDepartments
		.filter(department => department.code !== user.getOrganisationCode())
		.sort((a, b) => a.id - b.id)
		.slice(0, 20)
		.map(o => {
			return {code: o.code, name: o.name}
		})

	return {
		other: otherDepartments,
		selected: selectedDepartments,
		yours: {code: yourDepartment.code, name: yourDepartment.name},
	}
}

async function getAreasOfWorkData(user: model.User, selectedAreasOfWork: string[]): Promise<FilterBox> {
	const allAreasOfWork = (await getAreasOfWork(user)).topLevelList
		.filter(aow => aow.name !== "I don't know")
		.map(aow => aow.name)

	const userAreasOfWork = user.getAllAreasOfWork().map(aow => aow.name)
	const yourAreasOfWork = allAreasOfWork.filter(aow => userAreasOfWork.includes(aow))
	const otherAreasOfWork = allAreasOfWork.filter(aow => !yourAreasOfWork.includes(aow))

	return {
		other: otherAreasOfWork,
		selected: selectedAreasOfWork,
		yours: yourAreasOfWork,
	}
}

async function getInterestsData(user: model.User, selectedInterests: string[]): Promise<FilterBox> {
	const allInterests = (await getInterests(user)).list.map(interest => interest.name)

	const userInterests = (user.interests || []).map(interest => interest.name)
	const yourInterests = allInterests.filter(interest => userInterests.includes(interest))
	const otherInterests = allInterests.filter(interest => !yourInterests.includes(interest))

	return {
		other: otherInterests,
		selected: selectedInterests,
		yours: yourInterests,
	}
}
