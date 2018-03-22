import * as express from 'express'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as template from 'lib/ui/template'
import * as striptags from 'striptags'

export async function search(req: express.Request, res: express.Response) {
	let query = ''
	let searchResults: api.SearchResults = {
		page: 0,
		results: [],
		size: 20,
		totalResults: 0,
	}
	const start = new Date()
	if (req.query.q) {
		query = striptags(req.query.q)
		searchResults = await catalog.search(query)
	}
	const end: string = (((new Date() as any) - (start as any)) / 1000).toFixed(2)
	res.send(template.render('search', req, res, {end, query, searchResults}))
}
