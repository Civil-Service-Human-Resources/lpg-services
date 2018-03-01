import {Request, Response} from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as striptags from 'striptags'
import {Course} from 'lib/model/course'

const logger = log4js.getLogger('controllers/search')

export interface LearningPlan {
	mandatory: [Course]
	suggested: [Course]
	informal: [Course]
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

function filterCourses(allCourses: api.SearchResponse) {
	// let mandatory: api.Entry[] = allCourses.entries.filter(
	// 	course => course.tags == 'mandatory'
	// )

	let mandatory = allCourses.entries.filter(course =>
		course.tags.some(tag => tag === 'mandatory')
	)

	let suggested = allCourses.entries.filter(function(course) {
		return mandatory.indexOf(course) === -1
	})

	let informal = suggested.filter(course =>
		course.tags.some(tag => informalLearningTypes.includes(tag))
	)

	suggested = suggested.filter(function(course) {
		return informal.indexOf(course) === -1
	})

	return {
		mandatory: mandatory,
		suggested: suggested,
		informal: informal,
	}
}

export async function listAllCourses(req: Request, res: Response) {
	if (req.user.department) {
		const result = await catalog.listAll({}).catch((err: Error) => {
			logger.error(err)
		})
		const filteredResult = filterCourses(result)

		res.send(renderLearningPlan(req, filteredResult))
	} else {
		res.redirect('/profile')
	}
}

function renderLearningPlan(req: Request, props: LearningPlan) {
	return template.render('learning-plan', req, props)
}

export async function suggestedForYou(req: Request, res: Response) {
	const user = req.user as model.User
	const suggestedLearning = (await catalog.findSuggestedLearning(user)).entries

	res.send(
		template.render('suggested', req, {
			courses: suggestedLearning,
		})
	)
}

export async function elasticSearch(req: Request, res: Response) {
	let query = ''
	let searchResults: api.textSearchResponse = {entries: []}
	let start = new Date()
	if (req.query.q) {
		query = striptags(req.query.q)
		searchResults = await catalog.elasticSearch(query)
	}
	let end: string = (((new Date() as any) - (start as any)) / 1000).toFixed(2)
	res.send(template.render('search', req, {end, query, searchResults}))
}
