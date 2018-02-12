import axios from 'axios'
import * as express from 'express'
import * as config from 'lib/config'
import * as dateTime from 'lib/datetime'
import * as extended from 'lib/extended'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/learning-record')

export enum CourseState {
	Completed = 'completed',
	InProgress = 'in-progress',
}

function getCompletionDate(statements: xapi.Statement[]) {
	if (statements.length === 0) {
		return null
	}
	const completed = statements.find(
		statement => statement.verb.id === xapi.Verb.Completed
	)
	if (completed) {
		return dateTime.formatDate(new Date(completed.timestamp))
	}
	return null
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
			'X-Experience-API-Version': '1.0.3',
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
	const completionDate = getCompletionDate(statements)

	return {
		completionDate,
		result,
		state,
	}
}

export async function getLearningRecordOf(courseState: CourseState, user: any) {
	const agent = {
		mbox: `mailto:${user.emailAddress}`,
		name: user.id,
		objectType: 'Agent',
	}

	const response = await axios({
		auth: config.XAPI.auth,
		headers: {
			'X-Experience-API-Version': '1.0.3',
		},
		method: 'get',
		params: {
			agent: JSON.stringify(agent),
		},
		url: `${config.XAPI.url}/statements`,
	})

	const groupedStatements: Record<string, xapi.Statement[]> = {}
	for (const statement of response.data.statements as xapi.Statement[]) {
		const key = statement.object.id
		if (!groupedStatements[key]) {
			groupedStatements[key] = []
		}
		groupedStatements[key].push(statement)
	}

	const courses = []
	for (const [key, statements] of Object.entries(groupedStatements)) {
		const state = getState(statements)
		if (courseState === null || state === courseState) {
			const result = getResult(statements)
			const course = await catalog.findCourseByUri(key)
			if (!course) {
				logger.warn(
					`LRS data for course that doesn't exist. User ID: ${
						user.id
					}, course URI: ${key}`
				)
				continue
			}
			courses.push({
				...course,
				completionDate: await getCompletionDate(statements),
				result,
				state,
			})
		}
	}
	return courses
}

function getResult(statements: xapi.Statement[]) {
	if (!statements.length) {
		return null
	}
	const completedStatement = statements.find(
		statement => statement.verb.id === xapi.Verb.Completed
	)
	const resultStatement = statements.find(
		statement =>
			statement.verb.id === xapi.Verb.Passed ||
			statement.verb.id === xapi.Verb.Failed
	)

	let result = null
	let score = null

	if (completedStatement) {
		result = 'completed'
		if (completedStatement.result) {
			score = completedStatement.result.score
		}
	}
	if (resultStatement) {
		result = resultStatement.verb.id === xapi.Verb.Passed ? 'passed' : 'failed'
	}
	return {
		result,
		score,
	}
}

function getState(statements: xapi.Statement[]) {
	if (!statements.length) {
		return null
	}
	const completed = statements.find(
		statement => statement.verb.id === xapi.Verb.Completed
	)
	if (completed) {
		return 'completed'
	}
	return 'in-progress'
}

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
		const {state, result, completionDate} = await getCourseRecord(
			req.user,
			req.course
		)

		if (!state || state !== 'completed') {
			res.redirect('/basket')
		} else {
			res.send(
				template.render('learning-record/course-result', req, {
					completionDate,
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

export async function display(req: express.Request, res: express.Response) {
	logger.debug(`Displaying learning record for ${req.user.id}`)
	res.send(
		template.render('learning-record', req, {
			courses: await getLearningRecordOf(CourseState.Completed, req.user),
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
