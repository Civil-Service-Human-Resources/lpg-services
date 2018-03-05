import * as express from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as striptags from 'striptags'

export interface LearningPlan {
	mandatory: model.Course[]
	suggested: model.Course[]
	informal: model.Course[]
}

const informalLearningTypes = [
	'Blog post',
	'LinkedIn',
	'IACCM',
	'Video',
	'Github',
	'CIPS',
	'Conference',
]

const logger = log4js.getLogger('controllers/search')

function filterCourses(allCourses: api.SearchResponse) {
	const mandatory = allCourses.entries.filter(course =>
		course.tags.some(tag => tag === 'mandatory')
	)

	let suggested = allCourses.entries.filter(
		course => mandatory.indexOf(course) === -1
	)

	const informal = suggested.filter(course =>
		course.tags.some(tag => informalLearningTypes.includes(tag))
	)

	suggested = suggested.filter(course => informal.indexOf(course) === -1)

	return {
		informal,
		mandatory,
		suggested,
	}
}

function renderLearningPlan(req: express.Request, props: LearningPlan) {
	return template.render('learning-plan', req, props)
}

export async function elasticSearch(
	req: express.Request,
	res: express.Response
) {
	let query = ''
	let searchResults: api.TextSearchResponse = {entries: []}
	const start = new Date()
	if (req.query.q) {
		query = striptags(req.query.q)
		searchResults = await catalog.elasticSearch(query)
	}
	const end: string = (((new Date() as any) - (start as any)) / 1000).toFixed(2)
	res.send(template.render('search', req, {end, query, searchResults}))
}

export async function listAllCourses(
	req: express.Request,
	res: express.Response
) {
	if (req.user.department) {
		let result: api.SearchResponse
		try {
			result = await catalog.listAll({})
		} catch (err) {
			logger.error(err.toString())
			res.sendStatus(500)
			return
		}
		const filteredResult = filterCourses(result)
		res.send(renderLearningPlan(req, filteredResult))
	} else {
		res.redirect('/profile')
	}
}

export async function suggestedForYou(
	req: express.Request,
	res: express.Response
) {
	const user = req.user as model.User
	const suggestedLearning = (await catalog.findSuggestedLearning(user)).entries
	res.send(
		template.render('suggested', req, {
			courses: suggestedLearning,
		})
	)
}
