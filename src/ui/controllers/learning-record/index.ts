import * as express from 'express'
import * as extended from '../../../lib/extended'
import {getLogger} from '../../../lib/logger'
import * as courseRecordClient from '../../../lib/service/cslService/courseRecord/client'
import {
	learningPlanCache,
	learningRecordCache,
	requiredLearningCache,
	getLearningRecord,
} from '../../../lib/service/cslService/cslServiceClient'
import * as template from '../../../lib/ui/template'
import * as datetime from '../../../lib/datetime'

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

		const moduleState = module.getDisplayState(moduleRecord, course.getRequiredRecurringAudience())

		if (moduleState === 'IN_PROGRESS') {
			res.redirect(`/courses/${course.id}`)
		} else {
			await Promise.all([
				learningPlanCache.clearForCourse(req.user.id, course.id),
				learningRecordCache.delete(req.user.id),
				requiredLearningCache.clearForCourse(req.user.id, course.id),
			])
			const courseModuleDisplayStates: (string | null)[] = course.modules.map(m => {
				const recordForModule = courseRecord!.modules.find(mr => m.id === mr.moduleId)
				return m.getDisplayState(recordForModule, course.getRequiredRecurringAudience())
			})

			const courseCompleted = courseRecord && course.getDisplayState(courseRecord) === 'COMPLETED'
			const numberOfmodulesCompleted = courseModuleDisplayStates.filter(
				displayState => displayState === 'COMPLETED'
			).length

			res.send(
				template.render('learning-record/course-result', req, res, {
					highlight: {
						headingI18n: courseCompleted ? 'courseResult.complete' : 'moduleResult.complete',
						date: moduleRecord && moduleRecord.completionDate && datetime.formatDate(moduleRecord.completionDate),
						resourceTitle: courseCompleted ? `${course.title}` : `${module.title} (${course.title})`,
						completionIndicator: `${numberOfmodulesCompleted} out of ${course.modules.length} modules completed`,
					},
					pageBodyName: courseCompleted ? 'LEARNER_RECORD_UPDATED' : 'LINK_TO_COURSE_OVERVIEW',
					courseId: course.id,
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

	const learningRecord = await getLearningRecord(req.user)
	const requiredLearningStatusMessage: string = getRequiredLearningStatusMessage(
		learningRecord.requiredLearningRecord.completedCourses.length,
		learningRecord.requiredLearningRecord.totalRequired
	)
	return res.render('learning-record/index.njk', {
		requiredLearningStatusMessage,
		learningRecord,
	})
}

export function getRequiredLearningStatusMessage(
	numberOfCompletedRequiredCourses: number,
	numberOfTotalRequiredCourses: number
): string {
	let message
	if (numberOfTotalRequiredCourses > 0) {
		if (numberOfCompletedRequiredCourses === numberOfTotalRequiredCourses) {
			message = 'You have completed all of your required learning for this reporting year.'
		} else {
			message =
				numberOfCompletedRequiredCourses === 0
					? `You haven't completed any of your required courses.`
					: `You haven't completed all of your required learning for this reporting year.`
		}
	} else {
		message = 'There is no required learning for your department.'
	}

	return message
}
