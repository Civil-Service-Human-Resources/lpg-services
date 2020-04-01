import * as express from "express"
import {NextFunction} from "express"
import * as extended from "lib/extended"
import * as template from "lib/ui/template"

export async function render404(
		ireq: express.Request,
		res: express.Response,
		next: NextFunction
) {
	const req = ireq as extended.CourseRequest
	res.send(template.render('error/404', req, res, {}))
}

export async function render401(
		ireq: express.Request,
		res: express.Response,
		next: NextFunction
) {
	const req = ireq as extended.CourseRequest
	res.send(template.render('error/401', req, res, {}))
}
