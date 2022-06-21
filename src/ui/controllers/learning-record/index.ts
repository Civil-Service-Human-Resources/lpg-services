import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import {getLogger} from 'lib/logger'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'

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

export async function display(req: express.Request, res: express.Response) {
	logger.debug(`Displaying learning record for ${req.user.id}`)

	const [requiredLearning, learningRecord] = await Promise.all([
		catalog.findRequiredLearning(req.user),
		learnerRecord.getRawLearningRecord(req.user, [], ['COMPLETED']),
	])

	const completedLearning = learningRecord.sort((a, b) => {
		const bcd = b.getCompletionDate()
		const acd = a.getCompletionDate()

		const bt = bcd ? bcd.getTime() : 0
		const at = acd ? acd.getTime() : 0

		return bt - at
	})

	const completedRequiredLearning = []

	for (let i = 0; i < completedLearning.length; i++) {
		const courseRecord = completedLearning[i]
		const course = requiredLearning.results.find(
			c => c.id === courseRecord.courseId
		)
		if (course) {
			completedRequiredLearning.push(courseRecord)
			completedLearning.splice(i, 1)
			i -= 1
		}
	}

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