import * as express from 'express'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as striptags from 'striptags'

export async function search(req: express.Request, res: express.Response) {
	let query = ''
	let searchResults: api.TextSearchResponse = {entries: []}
	const start = new Date()
	if (req.query.q) {
		query = striptags(req.query.q)
		searchResults = await catalog.search(query)
	}
	const end: string = (((new Date() as any) - (start as any)) / 1000).toFixed(2)
	res.send(template.render('search', req, {end, query, searchResults}))
}

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
