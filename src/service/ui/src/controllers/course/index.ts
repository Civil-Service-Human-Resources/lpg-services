import {Request, Response, NextFunction} from 'express'
import {Course} from 'lib/model/course'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as youtube from 'lib/youtube'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/course/index')

export async function loadCourse(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const courseId: string = req.params.courseId
	const course = await catalog.get(courseId)
	if (course) {
		req.course = course
		next()
	} else {
		res.sendStatus(404)
	}
}

export async function resetCourses(req: Request, res: Response) {
	await catalog.resetCourses()
	res.redirect('/')
}

export async function display(req: Request, res: Response) {
	logger.debug(`Displaying course, courseId: ${req.params.courseId}`)
	const course = req.course as Course
	const props = {video: null}

	switch (course.type) {
		case 'video':
			props.video = (await getVideoData(course.uri)) as any
		case 'elearning':
			res.send(
				template.render(`course/${course.type}`, req, {
					...props,
					course,
					courseDetails: getCourseDetails(course),
				})
			)
			break
		default:
			logger.debug(
				`Course type (${course.type}) unsupported, redirecting to URI`
			)
			// TODO record initialisation / completion?
			res.redirect(course.uri)
	}
}

interface DataRow {
	label: string
	value: string
}

interface CourseDetail {
	label: string
	dataRows: DataRow[]
}

function getCourseDetails(course: Course): CourseDetail[] {
	const levels = course.tags
		.filter(tag => tag.startsWith('grade'))
		.map(tag => tag.replace('grade:', ''))
	const keyAreas = course.tags
		.filter(tag => tag.startsWith('key-area'))
		.map(tag => tag.replace('key-area:', ''))
	const duration = course.duration

	const dataRows: DataRow[] = []

	if (levels.length) {
		dataRows.push({
			label: 'Level',
			value: levels.join(', '),
		})
	}
	if (keyAreas.length) {
		dataRows.push({
			label: 'Key area',
			value: keyAreas.join(', '),
		})
	}
	if (duration) {
		dataRows.push({
			label: 'Duration',
			value: duration,
		})
	}

	return [
		{
			dataRows,
			label: 'Key information',
		},
	]
}

async function getVideoData(url: string) {
	const info = await youtube.getBasicInfo(url)
	if (!info) {
		return null
	}
	return info
}
