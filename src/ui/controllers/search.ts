import * as express from 'express'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as striptags from 'striptags'

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

	let searchResults: api.SearchResults = {
		page: 0,
		results: [],
		size: 10,
		totalResults: 0,
	}
	const start = new Date()
	if (req.query.p) {
		page = req.query.p
	}
	if (req.query.s) {
		size = req.query.s
	}
	if (req.query.q) {
		query = striptags(req.query.q)
		searchResults = await catalog.search(query, page, size)

		// lets pull get course record
		// rather than polling for each course lets get the learning record for the user
		const user = req.user as model.User
		const courseRecords = await learnerRecord.getLearningRecord(user)
		searchResults.results.forEach(result => {
			const course = courseRecords.find(record => record.id === result.id)
			if (course) {
				//we have a course record add it to the course
				result.record = course.record
			}
		})
	}

	const end: string = (((new Date() as any) - (start as any)) / 1000).toFixed(2)
	res.send(
		template.render('search', req, res, {end, query, searchResults, range})
	)
}
