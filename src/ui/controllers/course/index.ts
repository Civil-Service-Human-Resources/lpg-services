import * as express from 'express'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as config from 'lib/config'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as youtube from 'lib/youtube'
import * as log4js from 'log4js'

export interface CourseDetail {
	label: string
	dataRows: DataRow[]
}

export interface DataRow {
	label: string
	value: string
}

const logger = log4js.getLogger('controllers/course')

export function getCourseDetails(
	req: extended.CourseRequest,
	course: model.Course,
	module: model.Module
): CourseDetail[] {
	const levels = course.getGrades().map(grade => req.__(grade))
	const keyAreas = course.getAreasOfWork().map(areaOfWork => req.__(areaOfWork))

	const duration = course.getDuration()
	const productCode = module.productCode
	const location = module.location
	const price = course.price
	const dataRows: DataRow[] = []

	if (levels.length) {
		dataRows.push({
			label: req.__('Level'),
			value: levels.join(', '),
		})
	}
	if (keyAreas.length) {
		dataRows.push({
			label: req.__('Key area'),
			value: keyAreas.join(', '),
		})
	}
	if (duration) {
		dataRows.push({
			label: req.__('Duration'),
			value: duration,
		})
	}
	if (productCode) {
		dataRows.push({
			label: req.__('Product code'),
			value: productCode,
		})
	}
	if (location) {
		dataRows.push({
			label: req.__('Location'),
			value: location,
		})
	}
	if (price) {
		dataRows.push({
			label: req.__('Price'),
			value: `£${price}`,
		})
	}

	return [
		{
			dataRows,
			label: 'Key information',
		},
	]
}

export async function displayModule(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!

	switch (module.type) {
		case 'elearning':
			res.redirect(`${config.CONTENT_URL}/${course.id}/${module.id}/${module.startPage}`)
			break
		case 'face-to-face':
			res.redirect(`/book/${course.id}/${module.id}`)
			break
		case 'link':
			await xapi.record(req, course, xapi.Verb.Experienced, undefined, module)
			res.redirect(module.location!)
			break
		case 'video':
			const sessionId = await xapi.record(
				req,
				course,
				xapi.Verb.Initialised,
				undefined,
				module
			)
			res.send(
				template.render(`course/video`, req, {
					course,
					courseDetails: getCourseDetails(req, course, module),
					module,
					sessionId,
					video: await youtube.getBasicInfo(module.location!),
				})
			)
			break
		default:
			logger.debug(`Unknown module type: ${module.type}`)
			res.sendStatus(500)
	}
}

export async function display(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = course.modules[0]

	logger.debug(
		`Displaying course, courseId: ${req.params.courseId}, moduleId: ${
			module.id
		}`
	)

	const type = course.getType()

	switch (type) {
		case 'elearning':
		case 'face-to-face':
		case 'blended':
			res.send(
				template.render(`course/${type}`, req, {
					course,
					courseDetails: getCourseDetails(req, course, module),
					module,
				})
			)
			break
		case 'link':
		case 'video':
			res.redirect(`/courses/${course.id}/${module.id}`)
			break
		default:
			logger.debug(`Unknown course type: ${type}`)
			res.sendStatus(500)
	}
}

export async function loadCourse(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	const req = ireq as extended.CourseRequest
	const courseId: string = req.params.courseId
	const course = await catalog.get(courseId)
	if (course) {
		req.course = course
		next()
	} else {
		res.sendStatus(404)
	}
}

export async function loadModule(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	const req = ireq as extended.CourseRequest
	const moduleId: string = req.params.moduleId
	const course = req.course
	if (course) {
		const module = course.modules.find(m => m.id === moduleId)
		if (module) {
			req.module = module
			return next()
		}
	}
	res.sendStatus(404)
}

export async function loadEvent(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	const req = ireq as extended.CourseRequest
	const eventId: string = req.params.eventId
	const module = req.module
	if (module && module.events) {
		const event = module.events!.find(a => a.id === eventId)
		if (event) {
			req.event = event
			return next()
		}
	}
	res.sendStatus(404)
}

export async function markCourseDeleted(
	ireq: express.Request,
	res: express.Response
) {
	// TODO: don't use Terminated for delete
	// TODO: lookup learner record before delete to get moduleId and eventId
	const req = ireq as extended.CourseRequest
	await xapi.record(
		req,
		req.course,
		xapi.Verb.Terminated,
		undefined,
		req.course.modules[0]
	)
	res.redirect('/')
}
