import * as express from 'express'
import * as extended from '../../../lib/extended'
import {getLogger} from '../../../lib/logger'
import {Course} from '../../../lib/model'
import * as catalog from '../../../lib/service/catalog'
import * as courseRecordClient from '../../../lib/service/learnerRecordAPI/courseRecord/client'
import {CourseRecord} from '../../../lib/service/learnerRecordAPI/courseRecord/models/courseRecord'
import {RecordState} from '../../../lib/service/learnerRecordAPI/models/record'
import * as template from '../../../lib/ui/template'

const logger = getLogger('controllers/learning-record')

export async function courseResult(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	logger.debug(
		`Displaying course record for ${req.user.id}, courseId = ${req.params.courseId}, moduleId = ${req.params.moduleId}`
	)
	try {
		const course = req.course
		const module = req.module!
		const courseRecord = await courseRecordClient.getCourseRecord(course.id, req.user)
		let moduleRecord = null

		if (courseRecord && courseRecord.modules) {
			moduleRecord = courseRecord.modules.find(mr => module.id === mr.moduleId)
		}
		if (!moduleRecord || moduleRecord.state !== 'COMPLETED') {
			res.redirect(`/courses/${course.id}`)
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
						if (moduleCompletionDate && moduleCompletionDate > coursePreviousRequiredDate) {
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

export async function display(req: express.Request, res: express.Response) {
	logger.debug(`Displaying learning record for ${req.user.id}`)

	const [requiredLearning, learningRecord] = await Promise.all([
		catalog.findRequiredLearning(req.user, res.locals.departmentHierarchyCodes),
		courseRecordClient.getFullRecord(req.user),
	])

	const requiredCoursesMap: Map<string, Course> = new Map()
	requiredLearning.results.map(course => requiredCoursesMap.set(course.id, course))

	const completedCourseRecordsMap: Map<string, CourseRecord> = new Map()

	learningRecord
		.filter(cr => cr.isCompleted())
		.sort((a, b) => {
			const bcd = b.getCompletionDate()
			const acd = a.getCompletionDate()

			const bt = bcd ? bcd.getTime() : 0
			const at = acd ? acd.getTime() : 0

			return bt - at
		})
		.map(cr => completedCourseRecordsMap.set(cr.courseId, cr))

	const completedRequiredLearning: CourseRecord[] = []
	const completedLearning: CourseRecord[] = []

	completedCourseRecordsMap.forEach((courseRecord, courseId) => {
		const requiredCourse = requiredCoursesMap.get(courseId)
		if (requiredCourse) {
			const actualState = requiredCourse.getDisplayState(courseRecord)
			if (actualState === RecordState.Completed) {
				completedRequiredLearning.push(courseRecord)
			}
		} else {
			completedLearning.push(courseRecord)
		}
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
