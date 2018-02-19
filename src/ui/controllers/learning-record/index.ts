import * as express from 'express'
import * as extended from 'lib/extended'
import * as catalog from 'lib/service/catalog'
import * as learnerRecord from 'lib/learnerrecord'
import * as log4js from 'log4js'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'

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
		const record = await learnerRecord.getCourseRecord(
			req.user,
			req.course
		)

		if (!record || record.state !== 'completed') {
			res.redirect('/home')
		} else {
			res.send(
				template.render('learning-record/course-result', req, {
					course: req.course,
					record,
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
	const courses = await learnerRecord.getLearningRecordOf(learnerRecord.CourseState.Completed, req.user)
	res.send(
		template.render('learning-record', req, {
			courses,
		})
	)
}

export async function record(req: express.Request, res: express.Response) {
	const courseId = req.query.courseId
	const value = req.query.value
	if (!courseId) {
		logger.error('Expected a course ID to be present in the query parameters')
		res.sendStatus(500)
		return
	}
	const course = await catalog.get(courseId)
	if (!course) {
		logger.error(`No matching course found for course ID ${courseId}`)
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
	try {
		await xapi.record(req, courseId, verbId, value)
	} catch (err) {
		logger.error(err.toString())
		res.sendStatus(500)
	}
	res.sendStatus(200)
}
