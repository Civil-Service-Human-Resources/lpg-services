import {Request, Response} from 'express'
import {Course} from 'lib/model/course'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'

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
			console.log(err)
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
