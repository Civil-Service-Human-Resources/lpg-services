import * as express from 'express'
import {ClientError} from '../../../lib/exception/ClientError'
import * as extended from '../../../lib/extended'
import {getLogger} from '../../../lib/logger'
import * as catalog from '../../../lib/service/catalog'
import * as cslServiceClient from '../../../lib/service/cslService/cslServiceClient'
import {getCourseOverview, removeCourseFromLearningPlan} from '../../../lib/service/cslService/cslServiceClient'
import * as youtube from '../../../lib/youtube'
import {generateActionBanner, generateNotificationBanner} from '../home'

const logger = getLogger('controllers/course')

export async function displayModule(req: express.Request, res: express.Response) {
	try {
		const launchModuleResponse = await cslServiceClient.launchModule(req.params.courseId, req.params.moduleId, req.user)
		switch (launchModuleResponse.moduleType) {
			case 'elearning':
			case 'link':
			case 'file':
				return res.redirect(launchModuleResponse.launchLink)
			case 'video':
				res.locals.courseId = req.params.courseId
				res.locals.moduleId = req.params.moduleId
				if (launchModuleResponse.launchLink.match(/http(.+)youtube(.*)/) != null) {
					const video = await youtube.getBasicInfo(launchModuleResponse.launchLink)
					if (video === undefined) logger.warn(`Youtube video with URL ${launchModuleResponse.launchLink} not found`)
					return res.render('course/module/youtube-video.njk', {...launchModuleResponse, video})
				} else {
					return res.render('course/module/video.njk', launchModuleResponse)
				}
			default:
				logger.debug(`Can't launch a module of type ${launchModuleResponse.moduleType}`)
				return res.sendStatus(500)
		}
	} catch (e) {
		if (e instanceof ClientError) {
			logger.info(`Attempted to launch an archived course`)
			return res.redirect(`/courses/${req.params.courseId}`)
		} else {
			throw e
		}
	}
}

export async function display(req: express.Request, res: express.Response) {
	logger.debug(`Displaying course, courseId: ${req.params.courseId}`)
	const pageModel = await getCourseOverview(req.user, req.params.courseId)
	const learningPlan = [pageModel]
	const notificationBanner = await generateNotificationBanner(req, learningPlan)
	const actionBanner = await generateActionBanner(req, learningPlan)
	const pageTemplate = {
		elearning: 'elearning',
		file: 'file',
		video: 'singleModule',
		link: 'singleModule',
		blended: 'blended',
		'face-to-face': 'faceToFace',
		unknown: 'noModules',
	}[pageModel.type]
	return res.render(`course/${pageTemplate}.njk`, {
		pageModel: {
			...pageModel,
			backLink: res.locals.backLink,
		},
		banners: {
			notification: notificationBanner,
			action: actionBanner,
		},
	})
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
	const courseId = req.params.courseId
	const resp = await removeCourseFromLearningPlan(courseId, req.user)
	req.flash('successTitle', req.__('learning_removed_from_plan_title', resp.courseTitle))
	req.flash('successMessage', req.__('learning_removed_from_plan_message', resp.courseTitle))
	req.session!.save(() => {
		res.redirect(`/courses/${courseId}`)
	})
}
