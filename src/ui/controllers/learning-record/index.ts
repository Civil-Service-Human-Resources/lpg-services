import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/learning-record')

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
			course.modules.forEach(m => {
				let mr = courseRecord!.modules.find(mr => m.id === mr.moduleId)
				if(!mr || mr.state !== 'COMPLETED') {
					courseCompleted = false
				}
			})

			res.send(
				template.render('learning-record/course-result', req, res, {
					course,
					module,
					record: moduleRecord,
					courseCompleted
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

	const completedLearning = learningRecord
		.sort((a, b) => {
			const bcd = b.getCompletionDate()
			const acd = a.getCompletionDate()

			const bt = bcd ? bcd.getTime() : 0
			const at = acd ? acd.getTime() : 0

			return bt - at
		})

	const completedRequiredLearning = []

	for (let i = 0; i < completedLearning.length; i++) {
		const courseRecord = completedLearning[i]
		const course = requiredLearning.results.find(c => c.id === courseRecord.courseId)
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
			successMessage: req.flash('successMessage')[0],
			successTitle: req.flash('successTitle')[0],
		})
	)
}

export async function record(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const courseId = req.query.courseId
	if (!courseId) {
		logger.error('Expected a course ID to be present in the query parameters')
		res.sendStatus(400)
		return
	}
	const course = await catalog.get(courseId, req.user)
	if (!course) {
		logger.error(`No matching course found for course ID ${courseId}`)
		res.sendStatus(400)
		return
	}
	const moduleId = req.query.moduleId
	if (!moduleId) {
		logger.error('Expected a module ID to be present in the query parameters')
		res.sendStatus(400)
		return
	}
	const module = course.modules.find(m => m.id === moduleId)
	if (!module) {
		logger.error(`No matching module found for module ID ${moduleId}`)
		res.sendStatus(400)
		return
	}
	const verb = req.query.verb
	if (!verb) {
		logger.error('Expected a verb to be present in the query parameters')
		res.sendStatus(500)
		return
	}
	const verbId = xapi.lookup(verb)
	if (!verbId) {
		logger.error(`Unknown xAPI verb: ${verb}`)
		res.sendStatus(500)
		return
	}
	let extensions = req.query.extensions
	if (extensions) {
		try {
			extensions = JSON.parse(extensions)
		} catch (err) {
			logger.error(
				`Error decoding extensions data from JSON: "${extensions}": ${err}`
			)
			res.sendStatus(500)
			return
		}
	}
	let resultData = req.query.resultData
	if (resultData) {
		try {
			resultData = JSON.parse(resultData)
		} catch (err) {
			logger.error(
				`Error decoding resultData from JSON: "${resultData}": ${err}`
			)
			res.sendStatus(500)
			return
		}
	}
	try {
		await xapi.record(
			req,
			course,
			verbId,
			extensions,
			module,
			undefined,
			resultData
		)
	} catch (err) {
		logger.error(err.toString())
		res.sendStatus(500)
	}
	res.sendStatus(200)
}
