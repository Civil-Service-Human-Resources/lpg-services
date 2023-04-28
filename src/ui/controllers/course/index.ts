import * as express from 'express'
import * as config from 'lib/config'
import * as extended from 'lib/extended'
import { getLogger } from 'lib/logger'
import {RequiredRecurringAudience} from 'lib/model'
import * as model from 'lib/model'
import * as registry from 'lib/registry'
import * as catalog from 'lib/service/catalog'
import * as courseRecordClient from 'lib/service/learnerRecordAPI/courseRecord/client'
import {CourseRecord} from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {ModuleRecord} from 'lib/service/learnerRecordAPI/moduleRecord/models/moduleRecord'
import * as template from 'lib/ui/template'
import * as youtube from 'lib/youtube'

import {
	RemoveCourseFromLearningplanActionWorker
	// tslint:disable-next-line:max-line-length
} from 'lib/service/learnerRecordAPI/workers/courseRecordActionWorkers/RemoveCourseFromLearningplanActionWorker'
import {
	CompletedActionWorker
} from 'lib/service/learnerRecordAPI/workers/moduleRecordActionWorkers/CompletedActionWorker'
import {
	InitialiseActionWorker
} from 'lib/service/learnerRecordAPI/workers/moduleRecordActionWorkers/initialiseActionWorker'

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

export async function displayModule(
	ireq: express.Request,
	res: express.Response
) {
		const req = ireq as extended.CourseRequest

		const course = req.course
		const module = req.module!

		switch (module.type) {
			case 'elearning':
				await new InitialiseActionWorker(course, req.user, module).applyActionToLearnerRecord()
				res.redirect(
					`${module.url}/${module.startPage}?title=${encodeURIComponent(module.title) ||
					encodeURIComponent(course.title)}` +
					`&module=${module.id}&endpoint=${config.LPG_UI_SERVER}/courses/${
						course.id
					}/${module.id}/xapi/&actor={"name":"Noop"}`
				)
				break
			case 'face-to-face':
				res.redirect(`/book/${course.id}/${module.id}/choose-date`)
				break
			case 'link':
			case 'file':
				await new CompletedActionWorker(course, req.user, module).applyActionToLearnerRecord()
				res.redirect(module.url!)
				break
			case 'video':
				await new InitialiseActionWorker(course, req.user, module).applyActionToLearnerRecord()

				res.send(
					template.render(`course/display-video`, req, res, {
						course,
						courseDetails: getCourseDetails(req, course, module),
						module,
						video: !module.url!.search('/http(.+)youtube(.*)/i')
							? null
							: await youtube.getBasicInfo(module.url!),
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
	const module = singleModule !== undefined ? {
		...singleModule,
		isMandatory : !singleModule.optional,
	} : undefined

	logger.debug(`Displaying course, courseId: ${req.params.courseId}`)

	const type = course.getType()
	let canPayByPO = false

	switch (type) {
		case 'elearning':
		case 'face-to-face':
			if (req.user.department) {
				const organisationalUnit = (await registry.follow(
					config.REGISTRY_SERVICE_URL,
					['organisationalUnits', 'search', 'findByCode'],
					{code: req.user.department}
				)) as any
				canPayByPO =
					organisationalUnit.paymentMethods.indexOf('PURCHASE_ORDER') > -1
			}
		case 'file':
		case 'link':
		case 'video':
		case 'blended':
			const moduleMap: Map<string, any> = new Map()
			course.modules.forEach(mod => {
				moduleMap.set(mod.id, {
				...mod,
				displayState: null,
				duration: mod.getDuration(),
				isMandatory: !mod.optional,
				state: null,
			})})
			const courseRecord = await courseRecordClient.getCourseRecord(course.id, req.user)
			const audience = course.getRequiredRecurringAudience()
			if (courseRecord) {
				courseRecord.modules
					.filter(moduleRecord => [...moduleMap.keys()].includes(moduleRecord.moduleId))
					.forEach(moduleRecord => {
					const mapEntry = moduleMap.get(moduleRecord.moduleId)
					if (mapEntry) {
						mapEntry.state = moduleRecord.state || null
						mapEntry.displayState = getDisplayStateForModule(moduleRecord, courseRecord, audience)
					}
				})
			}
			const modules = [...moduleMap.values()]
			let recordState = "none"

			if (courseRecord && courseRecord.modules) {
				const faceToFaceModules = courseRecord.modules
					.filter(moduleFiltered => moduleFiltered.moduleType === "face-to-face")

				if ( faceToFaceModules.length !== 0) {
					// @ts-ignore
					recordState = faceToFaceModules[0].state
				}
			}
			res.send(
				template.render(`course/${type}`, req, res, {
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

export function getDisplayStateForModule(
	moduleRecord: ModuleRecord,
	courseRecord: CourseRecord,
	audience: RequiredRecurringAudience | null) {
	let displayStateLocal: string | null = moduleRecord.state ? moduleRecord.state : null
	if (audience) {
		const completionDate = moduleRecord.getCompletionDate().getTime()
		const updatedAt = moduleRecord.getUpdatedAt().getTime()
		const previousRequiredBy = audience.previousRequiredBy.getTime()
		if (completionDate <= previousRequiredBy && previousRequiredBy < updatedAt) {
			displayStateLocal = 'IN_PROGRESS'
		} else {
			if (courseRecord.isCompleted()) {
				if (updatedAt <= previousRequiredBy && completionDate <= previousRequiredBy) {
					displayStateLocal = null
				}
			} else {
				if (updatedAt <= previousRequiredBy) {
					displayStateLocal = null
				}
			}
		}
	}
	return displayStateLocal
}

export async function loadCourse(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
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
	const req = ireq as extended.CourseRequest
	await new RemoveCourseFromLearningplanActionWorker(req.course, req.user).applyActionToLearnerRecord()

	req.flash(
		'successTitle',
		req.__('learning_removed_from_plan_title', req.course.title)
	)
	req.flash(
		'successMessage',
		req.__('learning_removed_from_plan_message', req.course.title)
	)
	req.session!.save(() => {
		res.redirect('/')
	})
}
