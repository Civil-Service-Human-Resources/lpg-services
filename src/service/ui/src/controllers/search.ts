import * as express from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'

export interface LearningPlan {
	informal: model.Course[]
	mandatory: model.Course[]
	suggested: model.Course[]
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

export async function listAllCourses(
	req: express.Request,
	res: express.Response
) {
	if (req.user.department) {
		let result
		try {
			result = await catalog.listAll({})
		} catch (err) {
			logger.error(err.toString())
			res.sendStatus(500)
		}
		if (!result) {
			logger.error(`No results found for listAll for user ${req.user}`)
			res.sendStatus(500)
			return
		}
		const filteredResult = filterCourses(result)
		res.send(renderLearningPlan(req, filteredResult))
	} else {
		res.redirect('/profile')
	}
}
