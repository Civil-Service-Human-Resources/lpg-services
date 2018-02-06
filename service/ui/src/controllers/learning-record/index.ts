import {Request, Response} from 'express'
import * as log4js from 'log4js'
import * as config from 'lib/config'
import * as template from 'lib/ui/template'
import * as axios from 'axios'

const logger = log4js.getLogger('controllers/learning-record/index')

export async function display(req: Request, res: Response) {
	logger.debug(`Displaying learning record for ${req.user.id}`)
	res.send(template.render('learning-record', req))
}

export async function courseResult(req: Request, res: Response) {
	logger.debug(
		`Displaying course record for ${req.user.id}, courseId = ${
			req.params.courseId
		}`
	)

	const agent = {
		mbox: `mailto:${req.user.emailAddress}`,
		name: req.user.id,
		objectType: 'Agent',
	}

	try {
		const response = await axios({
			auth: config.XAPI.auth,
			headers: {
				'X-Experience-API-Version': '1.0.1',
			},
			method: 'get',
			params: {
				activity: req.course.uri,
				agent: JSON.stringify(agent),
			},
			url: `${config.XAPI.url}/statements`,
		})

		const statements = response.data.statements
		const state = getState(statements)

		if (!state) {
			res.redirect('/courses/' + req.params.courseId)
		} else {
			res.send(
				template.render('learning-record/course-result', req, {
					course: req.course,
					result: getResult(statements),
					state,
				})
			)
		}
	} catch (e) {
		logger.error('Error retrieving learner record', e)
		res.sendStatus(500)
	}
}

function getState(statements: [any]) {
	if (statements.length === 0) {
		return null
	}
	const completed = statements.find(
		statement =>
			statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed'
	)
	if (completed) {
		return 'completed'
	}
	return 'in-progress'
}

function getResult(statements: [any]) {
	return 'passed'
}
