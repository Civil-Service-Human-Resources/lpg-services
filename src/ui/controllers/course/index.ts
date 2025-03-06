import * as express from 'express'
import * as extended from '../../../lib/extended'
import {getLogger} from '../../../lib/logger'
import * as catalog from '../../../lib/service/catalog'
import * as cslServiceClient from '../../../lib/service/cslService/cslServiceClient'
import {removeCourseFromLearningPlan} from '../../../lib/service/cslService/cslServiceClient'
import * as template from '../../../lib/ui/template'
import * as youtube from '../../../lib/youtube'
import {getCoursePage} from './models/factory'

const logger = getLogger('controllers/course')

export async function displayModule(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!

	switch (module.type) {
		case 'elearning':
		case 'link':
		case 'file':
			const launchModuleResponse = await cslServiceClient.launchModule(course.id, module.id, req.user)
			res.redirect(launchModuleResponse.launchLink)
			break
		case 'face-to-face':
			res.redirect(`/book/${course.id}/${module.id}/choose-date`)
			break
		case 'video':
			const launchVideoModuleResponse = await cslServiceClient.launchModule(course.id, module.id, req.user)
			const videoLink = launchVideoModuleResponse.launchLink
			res.send(
				template.render(`course/display-video`, req, res, {
					course,
					module,
					video: !videoLink.search('/http(.+)youtube(.*)/i') ? null : await youtube.getBasicInfo(videoLink),
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
	logger.debug(`Displaying course, courseId: ${req.params.courseId}`)
	const pageModel = await getCoursePage(req.user, req.course)	
	
	pageModel.backLink = res.locals.backLink
	return res.render(`course/${pageModel.template}.njk`, {pageModel})
}

export async function loadCourse(ireq: express.Request, res: express.Response, next: express.NextFunction) {
	const req = ireq as extended.CourseRequest
	const courseId: string = req.params.courseId
	const course = await catalog.get(courseId, req.user, res.locals.departmentHierarchyCodes)
	if (course) {
		req.course = course
		next()
	} else {
		res.sendStatus(404)
	}
}

export async function loadModule(ireq: express.Request, res: express.Response, next: express.NextFunction) {
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
	console.log('404!')
	res.sendStatus(404)
}

export async function loadEvent(ireq: express.Request, res: express.Response, next: express.NextFunction) {
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

export async function markCourseDeleted(req: express.Request, res: express.Response) {
	const resp = await removeCourseFromLearningPlan(req.params.courseId, req.user)
	req.flash('successTitle', req.__('learning_removed_from_plan_title', resp.courseTitle))
	req.flash('successMessage', req.__('learning_removed_from_plan_message', resp.courseTitle))
	req.session!.save(() => {
		res.redirect('/')
	})
}
