import * as express from 'express'
import * as config from '../../lib/config'
import * as extended from '../../lib/extended'
import {getLogger} from '../../lib/logger'
import * as model from '../../lib/model'
import * as cslService from '../../lib/service/cslService/cslServiceClient'
import {LearningPlan} from '../../lib/service/cslService/models/learning/learningPlan/learningPlan'
import * as template from '../../lib/ui/template'

const logger = getLogger('controllers/home')

interface NotificationBanner {
	title: string
	message: string
}

interface ActionBanner extends NotificationBanner {
	yesHref: string
	yesText: string
	noHref: string
	noText: string
}

async function generateNotificationBanner(
	request: express.Request,
	learningPlan: LearningPlan
): Promise<NotificationBanner | null> {
	const successTitle = request.flash('successTitle')[0]
	const successMessage = request.flash('successMessage')[0]
	const successId = request.flash('successId')[0]
	let notificationBanner: NotificationBanner | null = null
	if (successTitle && successMessage) {
		if (successId) {
			for (const course of learningPlan.getAllCourses()) {
				if (course.id === successId) {
					course.justAdded = true
				}
			}
		}
		notificationBanner = {
			title: successTitle,
			message: successMessage,
		}
	}
	return notificationBanner
}

async function generateActionBanner(
	request: express.Request,
	learningPlan: LearningPlan
): Promise<ActionBanner | null> {
	for (const action of ['skip', 'move', 'delete']) {
		if (request.query[action]) {
			const [courseId, moduleId, eventId]: string = request.query[action].split(',')
			if (courseId !== undefined) {
				let course
				if (action === 'delete') {
					course = learningPlan.getAllCourses().find(c => c.id === courseId)
				} else if (moduleId !== undefined && eventId !== undefined) {
					course = learningPlan.bookedCourses.find(c => {
						return c.id === courseId && c.eventModule.id === moduleId && c.eventModule.eventId === eventId && c.canBeMovedToLearningRecord
					})
				}
				if (course !== undefined) {
					const yesHref = ['skip', 'move'].includes(action)
						? `/book/${courseId}/${moduleId}/${eventId}/${action}`
						: `/courses/${courseId}/delete`
					return {
						title: request.__('learning_confirm_' + action + '_plan_title', course.title),
						message: request.__('learning_confirm_' + action + '_plan_message'),
						yesText: request.__('learning_confirm_' + action + '_yes_option'),
						yesHref,
						noText: request.__('learning_confirm_' + action + '_no_option'),
						noHref: '/',
					}
				}
			}
		}
	}
	return null
}

export async function home(req: express.Request, res: express.Response, next: express.NextFunction) {
	logger.debug(`Getting learning record for ${req.user.id}`)
	try {
		const user = req.user as model.User
		const [learningPlan, requiredLearning] = await Promise.all([
			cslService.getLearningPlan(user),
			cslService.getRequiredLearning(user),
		])
		const notificationBanner = await generateNotificationBanner(req, learningPlan)
		const actionBanner = await generateActionBanner(req, learningPlan)
		return res.render('home/index.njk', {
			pageModel: {
				requiredLearning,
				learningPlan,
				banners: {
					notification: notificationBanner,
					action: actionBanner,
				},
			},
		})
	} catch (e) {
		console.error("Error building user's home page", e)
		next(e)
	}
}

export function index(req: express.Request, res: express.Response) {
	res.redirect('/home')
}

export function cookies(ireq: express.Request, res: express.Response) {
	res.cookie('seen_cookie_message', 'yes')

	const req = ireq as extended.CourseRequest
	res.send(template.render('/cookies', req, res, {}))
}

export function contactUs(req: express.Request, res: express.Response) {
	res.send(
		template.render('/contact-us', req, res, {
			contactEmail: config.CONTACT_EMAIL,
			contactNumber: config.CONTACT_NUMBER,
		})
	)
}
