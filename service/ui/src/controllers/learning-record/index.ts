import * as axios from 'axios'
import {Request, Response} from 'express'
import * as log4js from 'log4js'
import * as config from 'lib/config'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'

const logger = log4js.getLogger('controllers/learning-record/index')

export async function display(req: Request, res: Response) {
	logger.debug(`Displaying learning record for ${req.user.id}`)
	res.send(template.render('learning-record', req, {
		courses: await getLearningRecord(req.user)
	}))
}

export async function courseResult(req: Request, res: Response) {
	logger.debug(
		`Displaying course record for ${req.user.id}, courseId = ${
			req.params.courseId
		}`
	)

	try {
		const {state, result} = await getCourseRecord(req.user, req.course)

		if (!state) {
			res.redirect('/courses/' + req.params.courseId)
		} else {
			res.send(
				template.render('learning-record/course-result', req, {
					course: req.course,
					result,
					state,
				})
			)
		}
	} catch (e) {
		logger.error('Error retrieving learner record', e)
		res.sendStatus(500)
	}
}

async function getLearningRecord(user: any) {
	const agent = {
		mbox: `mailto:${user.emailAddress}`,
		name: user.id,
		objectType: 'Agent',
	}

	const response = await axios({
		auth: config.XAPI.auth,
		headers: {
			'X-Experience-API-Version': '1.0.1',
		},
		method: 'get',
		params: {
			agent: JSON.stringify(agent),
		},
		url: `${config.XAPI.url}/statements`,
	})

	const statements = response.data.statements
	const courses = []

	const groupedStatements = {}

	for (const statement of statements) {
		const key = statement.object.id
		if (!groupedStatements[key]) {
			groupedStatements[key] = []
		}
		groupedStatements[key].push(statement)
	}

	for (const key in groupedStatements) {
		const statements = groupedStatements[key]
		const state = getState(statements)
		if (state === 'completed') {
			const result = getResult(statements)
			const course = await catalog.findCourseByUri(key)
			courses.push({...course, result, state})
		}
	}
	return courses
}

async function getCourseRecord(user: any, course: any) {
	const agent = {
		mbox: `mailto:${user.emailAddress}`,
		name: user.id,
		objectType: 'Agent',
	}

	const response = await axios({
		auth: config.XAPI.auth,
		headers: {
			'X-Experience-API-Version': '1.0.1',
		},
		method: 'get',
		params: {
			activity: course.uri,
			agent: JSON.stringify(agent),
		},
		url: `${config.XAPI.url}/statements`,
	})

	const statements = response.data.statements
	const state = getState(statements)
	const result = getResult(statements)

	return {
		result,
		state,
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
