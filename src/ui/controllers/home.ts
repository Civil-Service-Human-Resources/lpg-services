import * as express from 'express'
import * as config from 'lib/config'
import * as datetime from 'lib/datetime'
import * as extended from 'lib/extended'
import { getLogger } from 'lib/logger'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as courseRecordClient from 'lib/service/learnerRecordAPI/courseRecord/client'
import * as template from 'lib/ui/template'

import { CourseRecord } from '../../lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import { RecordState } from '../../lib/service/learnerRecordAPI/models/record'

const logger = getLogger('controllers/home')

export const getRequiredLearning = (
	requiredCourses: model.Course[],
	courseRecordMap: Map<string, CourseRecord>): model.Course[] => {
	return requiredCourses.filter(course => {
		let required = false
		let courseState = RecordState.Null
		const courseRecord = courseRecordMap.get(course.id)
		if (courseRecord) {
			courseState = course.getDisplayState(courseRecord)
			courseRecord.state = courseState
			courseRecordMap.delete(course.id)
		}
		course.record = courseRecord
		if (courseState !== RecordState.Completed) {
			required = true
		}
		return required
	})
}

export const getLearningPlanRecords = (courseRecordMap: Map<string, CourseRecord>): CourseRecord[] => {
	const bookedLearning: CourseRecord[] = []
	const plannedLearning: CourseRecord[] = []
	courseRecordMap.forEach((record: CourseRecord) => {
		if (!record.isComplete() && record.isActive()) {
			if (!record.state && (record.modules || []).length) {
				record.state = RecordState.InProgress
			}
			if (record.getSelectedDate()) {
				const bookedModuleRecord = record.modules.find(m => !!m.eventId)
				if (bookedModuleRecord) {
					record.state = bookedModuleRecord.bookingStatus
				}
				bookedLearning.push(record)
			} else {
				plannedLearning.push(record)
			}
		}
	})

	bookedLearning.sort((a, b) => {
		return a.getSelectedDate()!.getDate() - b.getSelectedDate()!.getDate()
	})
	return [...bookedLearning, ...plannedLearning]

}

export async function home(req: express.Request, res: express.Response, next: express.NextFunction) {
	logger.debug(`Getting learning record for ${req.user.id}`)
	try {
		const user = req.user as model.User

		const [learningRecord, requiredLearningResults] = await Promise.all([
			courseRecordClient.getFullRecord(user),
			catalog.findRequiredLearning(user, res.locals.departmentHierarchyCodes),
		])
		const courseRecordMap: Map<string, CourseRecord> = new Map(
			learningRecord.map((cr): [string, CourseRecord] => [cr.courseId, cr])
		)
		const requiredLearning = getRequiredLearning(requiredLearningResults.results, courseRecordMap)

		const plannedLearningRecords = getLearningPlanRecords(courseRecordMap)
		const plannedLearning = []
		if (plannedLearningRecords.length > 0) {
			const learningPlanCourseIds = plannedLearningRecords.map(cr => cr.courseId)
			for (const course of await catalog.list(learningPlanCourseIds, user)) {
				if (course.hasModules()) {
					course.record = plannedLearningRecords.find(cr => cr.courseId === course.id)
					plannedLearning.push(course)
				}
			}
		}

		let removeCourseId
		let confirmTitle
		let confirmMessage
		let eventActionDetails
		let action = ''
		let yesOption
		let noOption

		if (req.query.delete) {
			// @ts-ignore
			const courseToDelete = await catalog.get(req.query.delete, user)
			confirmTitle = req.__(
				'learning_confirm_removal_plan_title',
				courseToDelete!.title
			)
			removeCourseId = courseToDelete!.id
			confirmMessage = req.__('learning_confirm_removal_plan_message')
		}

		if (req.query.skip) {
			action = 'skip'
		}

		if (req.query.move) {
			action = 'move'
		}

		if (req.query.skip || req.query.move) {
			// @ts-ignore
			eventActionDetails = req.query[action].split(',')
			eventActionDetails.push(action)
			const module = await catalog.get(eventActionDetails[0], user)

			confirmTitle = req.__(
				'learning_confirm_' + action + '_plan_title',
				module!.title
			)

			confirmMessage = req.__('learning_confirm_' + action + '_plan_message')
			yesOption = req.__('learning_confirm_' + action + '_yes_option')
			noOption = req.__('learning_confirm_' + action + '_no_option')
		}
		res.send(
			template.render('home', req, res, {
				confirmMessage,
				confirmTitle,
				eventActionDetails,
				formatEventDuration,
				getModuleForEvent,
				isEventBookedForGivenCourse,
				noOption,
				plannedLearning,
				removeCourseId,
				requiredLearning,
				successId: req.flash('successId')[0],
				successMessage: req.flash('successMessage')[0],
				successTitle: req.flash('successTitle')[0],
				yesOption,
			})
		)
	} catch (e) {
		console.error("Error building user's home page", e)
		next(e)
	}
}

function formatEventDuration(duration: number) {
	return datetime.formatCourseDuration(duration)
}

function filterCourseByEvent(course: model.Course) {
	return (
		course.record &&
		course.record.modules.filter(
			(module: any) => module.moduleType === 'face-to-face' && module.eventId
		)
	)
}

export function isEventBookedForGivenCourse(course: model.Course) {
	return filterCourseByEvent(course)!.length > 0
}

export function getModuleForEvent(course: model.Course) {
	return filterCourseByEvent(course)!.pop()
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
	res.send(template.render('/contact-us', req, res, {
		contactEmail: config.CONTACT_EMAIL,
		contactNumber: config.CONTACT_NUMBER,
	}))
}
