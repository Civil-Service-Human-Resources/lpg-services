import * as express from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as learningRecordController from './learning-record'
import * as body from 'body-parser'

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

export function index(req: express.Request, res: express.Response) {
	res.send(template.render('search', req))
}

export async function search(req: express.Request, res: express.Response) {
	let searchTerm = req.body.searchTerm
	let searchResults: api.textSearchResponse = await catalog.textSearch(
		searchTerm
	)

	res.send(template.render('search', req, {searchTerm, searchResults}))
}
