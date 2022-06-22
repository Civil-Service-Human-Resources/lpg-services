import * as express from 'express'
import * as extended from 'lib/extended'
import {getLogger} from 'lib/logger'
import * as catalog from 'lib/service/catalog'
import {completeModule} from '../../lib/service/fullLearnerRecord/fullLearnerRecordService'

const logger = getLogger('controllers/learning-record')

export async function completeVideoModule(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const courseId = req.query.courseId
	if (!courseId) {
		logger.error('Expected a course ID to be present in the query parameters')
		res.sendStatus(400)
		return
	}
	// @ts-ignore
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
	// @ts-ignore
	const mod = course.modules.find(m => m.id === moduleId)
	if (!mod) {
		logger.error(`No matching module found for module ID ${moduleId}`)
		res.sendStatus(400)
		return
	}

	completeModule(course, moduleId, req.user)
	res.sendStatus(200)
}
