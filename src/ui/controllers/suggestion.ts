import * as express from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as learningRecordController from './learning-record'
import * as xapi from 'lib/xapi'

export async function suggestedForYou(
	req: express.Request,
	res: express.Response
) {
	const user = req.user as model.User
	const suggestedLearning = (await catalog.findSuggestedLearning(user)).entries

	res.send(
		template.render('suggested', req, {
			courses: suggestedLearning,
		})
	)
}

export async function removeFromSuggested(
	req: express.Request,
	res: express.Response
) {
	let uid = req.params.courseId
	let verb = 'Disliked'
	const course = await catalog.get(uid)
	const verbId = xapi.lookup(verb)

	if (verbId && course) {
		try {
			let resp = await xapi.record(req, course, verbId, true)
			console.log('resp', resp)
		} catch (err) {
			logger.error(err.toString())
			res.sendStatus(500)
		} finally {
			res.redirect('/suggested-for-you')
		}
	} else {
		res.sendStatus(500)
	}
}

export async function addToPlan(req: express.Request, res: express.Response) {
	let uid = req.params.courseId
	let verb = 'add'
	const course = await catalog.get(uid)
}
