import {Request, Response} from 'express'
import * as catalog from 'lib/service/catalog'
import * as log4js from 'log4js'
import * as template from 'lib/ui/template'

const logger = log4js.getLogger('controllers/course/display')

export let index = async (req: Request, res: Response) => {
	const result = await catalog.listAll({})

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
