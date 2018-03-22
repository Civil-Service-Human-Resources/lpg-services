import * as express from 'express'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'

export function displayCourse(req: express.Request, res: express.Response) {
	res.send(template.render('courses/display', req, res, {}))
}

export async function index(req: express.Request, res: express.Response) {
	const result = await catalog.listAll()
	res.send(
		template.render('courses/list', req, res, {
			courses: result.results,
		})
	)
}
