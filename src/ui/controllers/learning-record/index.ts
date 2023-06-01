import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import { getLogger } from 'lib/logger'
import { Course } from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as courseRecordClient from 'lib/service/learnerRecordAPI/courseRecord/client'
import { CourseRecord } from 'lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import { RecordState } from 'lib/service/learnerRecordAPI/models/record'
import * as template from 'lib/ui/template'

import _ = require("lodash")
const logger = getLogger('controllers/learning-record')

export async function courseResult(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	logger.debug(
		`Displaying course record for ${req.user.id}, courseId = ${
			req.params.courseId
		}, moduleId = ${req.params.moduleId}`
	)
	try {
		const course = req.course
		const module = req.module!
		const courseRecord = await learnerRecord.getRecord(req.user, course, module)
		let moduleRecord = null

		if (courseRecord && courseRecord.modules) {
			moduleRecord = courseRecord.modules.find(mr => module.id === mr.moduleId)
		}
		if (!moduleRecord || moduleRecord.state !== 'COMPLETED') {
			res.redirect('/home')
		} else {
			let courseCompleted = true
			let modulesCompleted = 0
			course.modules.forEach(m => {
				const r = courseRecord!.modules.find(mr => m.id === mr.moduleId)
				if (!r || r.state !== 'COMPLETED') {
					courseCompleted = false
				} else {
					//LC-1054: module completion fix in the new learning period
					const coursePreviousRequiredDate = course.previousRequiredByNew()
					if (coursePreviousRequiredDate) {
						const moduleCompletionDate1 = r.completionDate
						const moduleCompletionDate = moduleCompletionDate1 ? new Date(moduleCompletionDate1.toDateString()) : null
						if (moduleCompletionDate &&
							moduleCompletionDate > coursePreviousRequiredDate) {
							modulesCompleted++
						} else {
							courseCompleted = false
						}
					} else {
						modulesCompleted++
					}
				}
			})

			res.send(
				template.render('learning-record/course-result', req, res, {
					course,
					courseCompleted,
					module,
					modulesCompleted,
					record: moduleRecord,
				})
			)
		}
	} catch (e) {
		logger.error('Error retrieving learner record', e)
		res.sendStatus(500)
	}
}

export function getDisplayStateForCourse(requiredCourse: Course, courseRecord: CourseRecord) {
	const audience = requiredCourse.getRequiredRecurringAudience()
	let displayStateLocal = courseRecord.state || RecordState.Null
	if (audience) {
		const previousRequiredBy = audience.previousRequiredBy.getTime()
		if (courseRecord.isCompleted()) {
			const requiredModuleCompletionDates = courseRecord.getCompletionDatesForModules(
				requiredCourse.modules.filter(m => !m.optional)
			)
			const latestCompletionDateOfModulesForCourse = (_.max(requiredModuleCompletionDates) || new Date(0)).getTime()
			const earliestCompletionDateOfModulesForCourse = (_.min(requiredModuleCompletionDates) || new Date(0)).getTime()
			if (earliestCompletionDateOfModulesForCourse <= previousRequiredBy) {
				if (latestCompletionDateOfModulesForCourse <= previousRequiredBy) {
					displayStateLocal = RecordState.Null
				} else {
					displayStateLocal = RecordState.InProgress
				}
			} else {
				displayStateLocal = RecordState.Completed
			}
		} else {
			const courseLastUpdated = courseRecord.getLastUpdated().getTime()
			if (courseLastUpdated <= previousRequiredBy) {
				displayStateLocal = RecordState.Null
			} else {
				displayStateLocal = RecordState.InProgress
			}
		}
	}
	return displayStateLocal
}

export async function display(req: express.Request, res: express.Response) {
	logger.debug(`Displaying learning record for ${req.user.id}`)

	const [requiredLearning, learningRecord] = await Promise.all([
		catalog.findRequiredLearning(req.user, res.locals.departmentHierarchyCodes),
		courseRecordClient.getFullRecord(req.user),
	])

	const requiredCourses = requiredLearning.results
	const completedCourseRecords = learningRecord
	.filter(cr => cr.isCompleted())
	.sort((a, b) => {
		const bcd = b.getCompletionDate()
		const acd = a.getCompletionDate()

		const bt = bcd ? bcd.getTime() : 0
		const at = acd ? acd.getTime() : 0

		return bt - at
	})

	const completedCourseRecordsMap: Map<string, CourseRecord> = new Map()
	completedCourseRecords.map(cr => completedCourseRecordsMap.set(cr.courseId, cr))

	const completedRequiredLearning = []
	const completedLearning: CourseRecord[] = []
	for (const requiredCourse of requiredCourses) {
		const courseRecord = completedCourseRecordsMap.get(requiredCourse.id)
		if (courseRecord) {
			const actualState = getDisplayStateForCourse(requiredCourse, courseRecord)
			if (actualState === RecordState.Completed) {
				completedRequiredLearning.push(courseRecord)
			}
			completedCourseRecordsMap.delete(requiredCourse.id)
		}
	}

	completedCourseRecordsMap.forEach((cr, id) => {
		completedLearning.push(cr)
	})

	res.send(
		template.render('learning-record', req, res, {
			completedLearning,
			completedRequiredLearning,
			requiredLearning,
			successMessage: req.flash('successMessage')[0],
			successTitle: req.flash('successTitle')[0],
		})
	)
}
