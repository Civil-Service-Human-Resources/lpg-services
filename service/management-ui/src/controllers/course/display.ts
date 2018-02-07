import {Request, Response} from 'express'
import * as catalog from 'lib/service/catalog'
import * as elko from 'lib/service/elko'
import * as log4js from 'log4js'
import * as template from 'lib/ui/template'

const logger = log4js.getLogger('controllers/course/display')

export let index = async (req: Request, res: Response) => {
	const result = await catalog.listAll({})

	console.log(
		'uid,title,type,identifier,uri,tags,shortDescription,description,learningOutcomes'
	)
	for (const course of result.entries) {
		console.log(
			`${course.uid},${o(course.title)},${course.type},${course.identifier ||
				''},${course.uri},"${course.tags.join(',')}",${o(
				course.shortDescription || ''
			)},${o(course.description || '')},${o(course.learningOutcomes || '')}`
		)
	}

	res.send(
		template.render('courses/list', req, {
			courses: result.entries,
		})
	)
}

export let displayCourse = (req: Request, res: Response) => {
	res.send(template.render('courses/display', req, {}))
}

function o(text: string) {
	return `"${text.replace(/"/g, '""')}"`
}
