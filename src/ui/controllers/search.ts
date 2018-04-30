import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as striptags from 'striptags'
import {isArray} from 'util'

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
	let courseType = ''
	let cost = ''

	let searchResults: api.SearchResults = {
		page: 0,
		results: [],
		combinedResults: [],
		size: 10,
		totalResults: 0,
	}

	let combinedResults: model.CourseModule[] = []

	const start = new Date()
	if (req.query.p) {
		page = req.query.p
	}
	if (req.query.s) {
		size = req.query.s
	}

	if (req.query.courseType) {
		courseType = isArray(req.query.courseType)
			? req.query.courseType.join()
			: req.query.courseType
	}

	if (req.query.cost) {
		cost = req.query.cost
	}

	if (req.query.q) {
		query = striptags(req.query.q)
		searchResults = await catalog.search(query, page, size, courseType, cost)

		// lets pull get course record
		// rather than polling for each course lets get the learning record for the user
		const user = req.user as model.User
		const courseRecords = await learnerRecord.getLearningRecord(user)

		searchResults.results.forEach(result => {
			let cmResult = result as model.CourseModule
			if (cmResult.type === 'course') {
				// a course
				const course = courseRecords.find(
					record => cmResult.course.id === cmResult.course.id
				)
				if (course) {
					//we have a course record add it to the course
					cmResult.course.record = course.record
				}
			}
			combinedResults.push(cmResult)
			searchResults.combinedResults = combinedResults
		})
	}

	const end: string = (((new Date() as any) - (start as any)) / 1000).toFixed(2)

	// let filters: SearchFilter[] = []

	// let learningFilter : SearchFilter =
	res.send(
		template.render('search', req, res, {
			end,
			query,
			searchResults,
			range,
			courseType,
			cost,
		})
	)
}
