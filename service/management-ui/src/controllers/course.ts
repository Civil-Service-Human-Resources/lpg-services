import {Request, Response} from 'express'
import * as catalog from 'management-ui/service/catalog'
import * as elko from 'management-ui/service/elko'
import * as log4js from 'log4js'
import * as template from 'management-ui/template'

const SCHEMA = `tags: [string] @count @index(term) .
title: string @index(fulltext) .
uri: string .
`

const logger = log4js.getLogger('controllers/course')

export let index = async (req: Request, res: Response) => {
	// async function catalogDemo(req: express.Request, res: express.Response) {
	// 	await catalog.wipe(elko.context())
	// 	await catalog.setSchema(elko.context(), {schema: SCHEMA})
	// 	for (const [title, tags] of Object.entries({
	// 		Alice: ['david', 'jen'],
	// 		Reia: ['alice', 'tav'],
	// 		Zeno: ['alice', 'tav'],
	// 	})) {
	// 		const id = await catalog.add(elko.context(), {
	// 			entry: {tags, title, uri: 'family'},
	// 		})
	// 		console.log('Created:', id)
	// 	}
	// 	const resp = await catalog.search(elko.context(), {
	// 		// after: '0x01',
	// 		first: 1,
	// 		tags: ['alice', 'david', 'tav'],
	// 	})
	// 	res.send(JSON.stringify(resp))
	// }
	//
	// app.get('/catalog.demo', (req, res) => {
	// 	catalogDemo(req, res).catch((err: Error) => {
	// 		console.log('Got error with catalog.demo:', err)
	// 	})
	// })

	const result = await catalog.listAll(elko.context())

	res.send(
		template.render('courses/list', req, {
			courses: result.entries,
		})
	)
}

export let editCourse = (req: Request, res: Response) => {
	res.send(template.render('courses/edit', req, {}))
}

export let doEditCourse = async (req: Request, res: Response) => {
	const entry = {
		...req.body,
		uri: 'http://cslearning.gov.uk',
	}

	await catalog.setSchema(elko.context(), {schema: SCHEMA})

	const id = await catalog.add(elko.context(), {
		entry,
	})

	logger.debug(`Course ${id} updated`)

	res.redirect('/courses')
}

export let displayCourse = (req: Request, res: Response) => {
	res.send(template.render('courses/display', req, {}))
}
