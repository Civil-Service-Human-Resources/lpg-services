import * as express from 'express'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
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
	course: model.Course
): CourseDetail[] {
	const levels = getTagValues(req, 'grade', course.tags)
	const keyAreas = getTagValues(req, 'key-area', course.tags)
	const duration = course.duration
	const productCode = course.productCode
	const location = course.location
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

function getTagValues(
	req: extended.CourseRequest,
	tagName: string,
	tags: string[]
) {
	return tags
		.filter(tag => tag.startsWith(tagName))
		.map(tag => req.__(tag.replace(`${tagName}:`, '')))
}
export async function display(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	logger.debug(`Displaying course, courseId: ${req.params.courseId}`)
	switch (course.type) {
		case 'elearning':
			res.send(
				template.render(`course/${course.type}`, req, {
					course,
					courseDetails: getCourseDetails(req, course),
				})
			)
			break
		case 'link':
			await xapi.record(req, req.course, xapi.Verb.Initialised)
			await xapi.record(req, req.course, xapi.Verb.Completed)
			res.redirect(course.uri)
			break
		case 'video':
			await xapi.record(req, req.course, xapi.Verb.Initialised)
			res.send(
				template.render(`course/${course.type}`, req, {
					course,
					courseDetails: getCourseDetails(req, course),
					video: await youtube.getBasicInfo(course.uri),
				})
			)
			break
		case 'face-to-face':
			res.send(
				template.render(`course/${course.type}`, req, {
					course,
					courseDetails: getCourseDetails(req, course),
				})
			)
			break
		default:
			logger.debug(`Unknown course type: (${course.type})`)
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

export async function resetCourses(
	req: express.Request,
	res: express.Response
) {
	await catalog.resetCourses()
	res.redirect('/')
}

export async function markCourseDeleted(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	await xapi.record(req, req.course, xapi.Verb.Terminated)
	res.redirect('/')
}
