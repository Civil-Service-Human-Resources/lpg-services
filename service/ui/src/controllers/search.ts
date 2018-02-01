import {Request, Response} from 'express'
import * as template from 'lib/ui/template'
import * as catalog from 'lib/service/catalog'
import * as elko from 'lib/service/elko'

const SCHEMA = `tags: [string] @count @index(exact) .
title: string @index(fulltext) .
uri: string .
`

export interface Course {
	title: string
	tags: [string]
	shortDescription?: string
	uri: string
	uid: string
}

export interface LearningPlan {
	mandatory: [Course]
	suggested: [Course]
}

function filterCourses(allCourses: JSON) {
	let mandatory: [Course] = allCourses.entries.filter(
		course => course.tags == 'mandatory'
	)
	let suggested: [Course] = allCourses.entries.filter(
		course => course.tags != 'mandatory'
	)

	return {
		mandatory: mandatory,
		suggested: suggested,
	}
}

export let listAllCourses = async (req: Request, res: Response) => {
	await catalog.setSchema(elko.context(), {schema: SCHEMA})
	await catalog.wipe(elko.context())

	const result = await catalog.listAll(elko.context(), {})
	console.log(result)

	res.send(result)

	// if (req.user.department) {
	// 	await catalog.setSchema(elko.context(), {schema: SCHEMA})
	//
	// 	const result = await catalog.listAll(elko.context(), {})
	// 	const filteredResult = filterCourses(result)
	//
	// 	res.send(renderLearningPlan(req, filteredResult))
	// } else {
	// 	res.redirect('/profile')
	// }
}

function renderLearningPlan(req: Request, props: LearningPlan) {
	return template.render('learning-plan', req, props)
}
