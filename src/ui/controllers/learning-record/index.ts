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
		}`
	)
	try {
		const courseRecord = await learnerRecord.getCourseRecord(
			req.user,
			req.course
		)

		if (!courseRecord || courseRecord.state !== 'COMPLETED') {
			res.redirect('/home')
		} else {
			res.send(
				template.render('learning-record/course-result', req, {
					course: req.course,
					record: courseRecord,
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

	const completedLearning = await learnerRecord.getLearningRecordOf(
		learnerRecord.CourseState.Completed,
		req.user
	)
	const requiredLearningTotal = (await catalog.findRequiredLearning(req.user))
		.entries.length

	const completedRequiredLearning = []

	for (const [i, course] of completedLearning.entries()) {
		if (course.isRequired(req.user)) {
			completedRequiredLearning.push(course)
			completedLearning.splice(i, 1)
		}
	}

	res.send(
		template.render('learning-record', req, {
			completedLearning,
			completedRequiredLearning,
			requiredLearningTotal,
		})
	)
}

export async function record(req: express.Request, res: express.Response) {
	const courseId = req.query.courseId
	if (!courseId) {
		logger.error('Expected a course ID to be present in the query parameters')
		res.sendStatus(400)
		return
	}
	const course = await catalog.get(courseId)
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
	try {
		await xapi.record(req, course, verbId, extensions, module)
	} catch (err) {
		logger.error(err.toString())
		res.sendStatus(500)
	}
	res.sendStatus(200)
}
