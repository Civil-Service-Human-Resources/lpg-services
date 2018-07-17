import * as express from 'express'
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

export async function search(req: express.Request, res: express.Response) {
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

	const searchResults = await catalog.search(page, size, query, courseTypes, cost, areasOfWork, departments, interests)

	// lets pull get course record
	// rather than polling for each course lets get the learning record for the user
	const user = req.user as model.User

	const courseRecords = await learnerRecord.getLearningRecord(user)

	searchResults.results.forEach(result => {
		const cmResult = result as model.CourseModule
		delete cmResult.course.record

		const courseRecord = courseRecords.find(
			record => cmResult.course.id === record.id
		)
		if (courseRecord) {
			// we have a course record add it to the course
			cmResult.course.record = courseRecord.record
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

	const yourAreasOfWork = allAreasOfWork.filter(aow =>
		(user.areasOfWork || []).indexOf(aow.name) > -1 || (user.otherAreasOfWork || []).indexOf(aow.name) > -1)
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

	const yourInterests = allInterests.filter(interest => (user.interests || []).indexOf(interest.name) > -1)
		.map(interest => interest.name)

	const otherInterests = allInterests.filter(interest => yourInterests.indexOf(interest.name) === -1)
		.map(interest => interest.name)

	return {
		other: otherInterests,
		selected: selectedInterests,
		yours: yourInterests,
	}
}
