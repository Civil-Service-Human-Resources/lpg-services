import * as model from '../../../lib/model'
import {Course, User} from '../../../lib/model'
import {courseSearch} from '../../../lib/service/catalog/courseCatalogueClient'
import {buildParams} from '../../../lib/service/catalog/models/courseSearchParams'
import {CourseSearchResponse} from '../../../lib/service/catalog/models/courseSearchResponse'
import {getAreasOfWork, getInterests} from '../../../lib/service/civilServantRegistry/csrsService'
import * as csrsService from '../../../lib/service/civilServantRegistry/csrsService'
import * as courseRecordClient from '../../../lib/service/learnerRecordAPI/courseRecord/client'
import {CourseSearchQuery} from './models/courseSearchQuery'
import {FilterBox, Pagination, PaginationNumberedPage, SearchPageModel} from './models/searchPageModel'

export async function searchForCourses(params: CourseSearchQuery, user: User) {
	const searchQuery = buildParams(params)
	const searchResults = await courseSearch(searchQuery, user)
	const courseRecords = await courseRecordClient.getCourseRecords(searchResults.results.map(r => r.id), user)

	searchResults.results.forEach(result => {
		const cmResult = result as Course
		delete cmResult.record

		const courseRecord = courseRecords.find(record => cmResult.id === record.courseId)
		if (courseRecord) {
			// we have a course record add it to the course
			cmResult.record = courseRecord
		}
	})

	const [departmentData, areasOfWorkData, interestsData] = await Promise.all([
		getDepartmentData(user, params.department),
		getAreasOfWorkData(user, params.areaOfWork),
		getInterestsData(user, params.interest),
	])

	const pagination = getPagination(params, searchResults)

	return new SearchPageModel(areasOfWorkData, departmentData, interestsData,
		params.courseType, params.q, searchResults.results, pagination, params.cost)
}

export function getPagination(params: CourseSearchQuery, searchResults: CourseSearchResponse): Pagination {
	let prevLink: string | undefined
	let nextLink: string | undefined
	const numberedPages: PaginationNumberedPage[] = []
	if (searchResults.totalResults > 0) {
		const fePage = searchResults.page + 1
		const pages = Math.ceil(searchResults.totalResults/searchResults.size)
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
		start: (searchResults.page*searchResults.size)+1,
		end: (searchResults.page*searchResults.size)+searchResults.results.length,
		total: searchResults.totalResults
	}
}


async function getDepartmentData(user: model.User, selectedDepartments: string[]): Promise<FilterBox> {
	const allDepartments = (await csrsService.getAllOrganisationUnits(user)).typeahead
	const yourDepartment = allDepartments.find(department => department.code === user.getOrganisationCode())
	/**
	 * NOTE: 20221117 - the code below will sort/slice the department list based on ID. This is to
	 * replicate the current functionality of only showing the first 20 departments, in order of
	 * ID.
	 */
	const otherDepartments = allDepartments
		.filter(department => department.code !== user.getOrganisationCode())
		.sort((a, b) => a.id - b.id)
		.slice(0, 20)

	return {
		other: otherDepartments.map(o => o.code),
		selected: selectedDepartments,
		yours: yourDepartment ? [yourDepartment.code] : [],
	}
}

async function getAreasOfWorkData(user: model.User, selectedAreasOfWork: string[]): Promise<FilterBox> {
	const allAreasOfWork = (await getAreasOfWork(user)).topLevelList.filter(aow => aow.name !== "I don't know")

	const userAreasOfWork = (user.otherAreasOfWork || [])
		.map(aow => aow.name)
		.concat((user.areaOfWork ? [user.areaOfWork] : []).map(aow => aow.name))

	const yourAreasOfWork = allAreasOfWork.filter(aow => userAreasOfWork.includes(aow.name)).map(aow => aow.name)
	const otherAreasOfWork = allAreasOfWork.filter(aow => !yourAreasOfWork.includes(aow.name)).map(aow => aow.name)

	return {
		other: otherAreasOfWork,
		selected: selectedAreasOfWork,
		yours: yourAreasOfWork,
	}
}

async function getInterestsData(user: model.User, selectedInterests: string[]): Promise<FilterBox> {
	const allInterests = (await getInterests(user)).list

	const userInterests = (user.interests || []).map(interest => interest.name)

	const yourInterests = allInterests
		.filter(interest => userInterests.includes(interest.name))
		.map(interest => interest.name)

	const otherInterests = allInterests
		.filter(interest => !yourInterests.includes(interest.name))
		.map(interest => interest.name)

	return {
		other: otherInterests,
		selected: selectedInterests,
		yours: yourInterests,
	}
}
