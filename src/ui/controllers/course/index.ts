import * as express from 'express'
import * as extended from '../../../lib/extended'
import {getLogger} from '../../../lib/logger'
import * as model from '../../../lib/model'
import * as catalog from '../../../lib/service/catalog'
import * as cslServiceClient from '../../../lib/service/cslService/cslServiceClient'
import {removeCourseFromLearningPlan} from '../../../lib/service/cslService/cslServiceClient'
import * as courseRecordClient from '../../../lib/service/learnerRecordAPI/courseRecord/client'
import {ModuleRecord} from '../../../lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'
import * as template from '../../../lib/ui/template'
import * as youtube from '../../../lib/youtube'

export interface CourseDetail {
	label: string
	dataRows: DataRow[]
}

export interface DataRow {
	label: string
	value: string
}

const logger = getLogger('controllers/course')

export function getCourseDetails(
	req: extended.CourseRequest,
	course: model.Course,
	module?: model.Module
): CourseDetail[] {
	const levels = course.getGrades().map(grade => req.__(grade))
	const keyAreas = course.getAreasOfWork().map(areaOfWork => req.__(areaOfWork))

	const duration = course.getDuration()
	const location = module ? module.location : null
	const cost = course.getCost()
	const dataRows: DataRow[] = []

	dataRows.push({
		label: 'Course type',
		value: req.__(course.getType()!),
	})

	if (duration) {
		dataRows.push({
			label: req.__('Duration'),
			value: duration,
		})
	}
	if (keyAreas.length) {
		dataRows.push({
			label: req.__('Key area'),
			value: keyAreas.join(', '),
		})
	}
	if (location) {
		dataRows.push({
			label: req.__('Location'),
			value: location,
		})
	}
	if (levels.length) {
		dataRows.push({
			label: req.__('Level'),
			value: levels.join(', '),
		})
	}
	if (cost) {
		dataRows.push({
			label: req.__('Cost'),
			value: `£${cost}`,
		})
	}

	return [
		{
			dataRows,
			label: 'Key information',
		},
	]
}

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
					courseDetails: getCourseDetails(req, course, module),
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

	const course = req.course
	const singleModule = course.modules.length === 1 ? course.modules[0] : undefined
	const module =
		singleModule !== undefined
			? {
					...singleModule,
					isMandatory: !singleModule.optional,
				}
			: undefined

	logger.debug(`Displaying course, courseId: ${req.params.courseId}`)

	const type = course.getType()
	let canPayByPO = false

	switch (type) {
		case 'elearning':
		case 'face-to-face':
			canPayByPO = true
		case 'file':
		case 'link':
		case 'video':
		case 'blended':
			const courseRecord = await courseRecordClient.getCourseRecord(course.id, req.user)
			const moduleRecords: Map<string, ModuleRecord> = courseRecord ? courseRecord.getModuleRecordMap() : new Map()
			const audience = course.getRequiredRecurringAudience()
			const modules = course.modules.map(mod => {
				const mr = moduleRecords.get(mod.id)
				return {
					...mod,
					displayState: mod.getDisplayState(mr, audience),
					duration: mod.getDuration(),
					isMandatory: !mod.optional,
					state: mr ? mr.getState() : null,
				}
			})
			let recordState = 'none'

			if (courseRecord && courseRecord.modules) {
				const faceToFaceModules = courseRecord.modules.filter(
					moduleFiltered => moduleFiltered.moduleType === 'face-to-face'
				)

				if (faceToFaceModules.length !== 0) {
					// @ts-ignore
					recordState = faceToFaceModules[0].state
				}
			}
			res.send(
				template.render(`course/${type}`, req, res, {
					backLink: res.locals.backLink,
					canPayByPO,
					course,
					courseDetails: getCourseDetails(req, course, singleModule),
					module,
					modules,
					recordState,
				})
			)
			break
		case 'link':
		case 'video':
			res.redirect(`/courses/${course.id}/${module!.id}`)
			break
		default:
			res.send(
				template.render(`course/noModuleCourse`, req, res, {
					course,
				})
			)
			break
	}
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
