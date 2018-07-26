import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as registry from 'lib/registry'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as striptags from 'striptags'

export interface SearchFilter {
	label: string
	dataRows: DataRow[]
}

export interface DataRow {
	label: string
	value: string
}

function range(start: number, stop?: number, step?: number) {
	const out = []
	if (stop === undefined) {
		stop = start
		start = 0
	}
	if (step) {
		while (stop > start) {
			out.push(start)
			start += step
		}
	} else {
		while (stop > start) {
			out.push(start)
			start += 1
		}
	}
	return out
}

export async function search(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest

	let query = ''
	let page = 0
	let size = 10

	let cost = ''
	let courseTypes: string[] = []
	let departments: string[] = []
	let areasOfWork: string[] = []
	let interests: string[] = []

	const combinedResults: model.CourseModule[] = []

	const start = new Date()
	if (req.query.p) {
		page = req.query.p
	}
	if (req.query.s) {
		size = req.query.s
	}

	if (req.query.courseType) {
		if (Array.isArray(req.query.courseType)) {
			courseTypes = req.query.courseType
		} else {
			courseTypes = [req.query.courseType]
		}
	}

	if (req.query.department) {
		if (Array.isArray(req.query.department)) {
			departments = req.query.department
		} else {
			departments = [req.query.department]
		}
	}

	if (req.query.areaOfWork) {
		if (Array.isArray(req.query.areaOfWork)) {
			areasOfWork = req.query.areaOfWork
		} else {
			areasOfWork = [req.query.areaOfWork]
		}
	}

	if (req.query.interest) {
		if (Array.isArray(req.query.interest)) {
			interests = req.query.interest
		} else {
			interests = [req.query.interest]
		}
	}

	if (req.query.cost) {
		cost = req.query.cost
	}

	if (req.query.q) {
		query = striptags(req.query.q)
	}

	const user = req.user as model.User

	const searchResults = await catalog.search(user, page, size, query, courseTypes, cost, areasOfWork,
		departments, interests)

	const courseRecords = await learnerRecord.getRawLearningRecord(user)

	searchResults.results.forEach(result => {
		const cmResult = result as model.CourseModule
		delete cmResult.course.record

		const courseRecord = courseRecords.find(
			record => cmResult.course.id === record.courseId
		)
		if (courseRecord) {
			// we have a course record add it to the course
			cmResult.course.record = courseRecord
		}

		combinedResults.push(cmResult)
		searchResults.combinedResults = combinedResults
	})

	const end: string = (((new Date() as any) - (start as any)) / 1000).toFixed(2)

	const [ departmentData, areasOfWorkData, interestsData ] = await Promise.all([
		getDepartmentData(user, departments),
		getAreasOfWorkData(user, areasOfWork),
		getInterestsData(user, interests),
	])

	res.send(
		template.render('search', req, res, {
			areasOfWork: areasOfWorkData,
			cost,
			courseTypes,
			departments: departmentData,
			end,
			expand: req.query.expand,
			interests: interestsData,
			query,
			range,
			searchResults,
		})
	)
}

async function getDepartmentData(user: model.User, selectedDepartments: string[]) {
	const allDepartments = (await registry.halNode('organisations'))
		.map(organisation => organisation.department)

	const yourDepartment = allDepartments.find(department => department.code === user.department)
	const otherDepartments = allDepartments.filter(department => department.code !== user.department)

	return {
		other: otherDepartments,
		selected: selectedDepartments,
		yours: yourDepartment ? [yourDepartment] : [],
	}
}

async function getAreasOfWorkData(user: model.User, selectedAreasOfWork: string[]) {
	const allAreasOfWork = await registry.halNode('professions')
	const userAreasOfWork = (user.otherAreasOfWork || []).map(aow => aow.name)
		.concat(user.areasOfWork || [])

	const yourAreasOfWork = allAreasOfWork.filter(aow => userAreasOfWork.indexOf(aow.name) > -1)
		.map(aow => aow.name)

	const otherAreasOfWork = allAreasOfWork.filter(aow => yourAreasOfWork.indexOf(aow.name) === -1)
		.map(aow => aow.name)

	return {
		other: otherAreasOfWork,
		selected: selectedAreasOfWork,
		yours: yourAreasOfWork,
	}
}

async function getInterestsData(user: model.User, selectedInterests: string[]) {
	const allInterests = await registry.halNode('interests')
	const userInterests = (user.interests || []).map(interest => interest.name)

	const yourInterests = allInterests.filter(interest => userInterests.indexOf(interest.name) > -1)
		.map(interest => interest.name)

	const otherInterests = allInterests.filter(interest => yourInterests.indexOf(interest.name) === -1)
		.map(interest => interest.name)

	return {
		other: otherInterests,
		selected: selectedInterests,
		yours: yourInterests,
	}
}
