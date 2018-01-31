import {Request, Response} from 'express'
import * as catalog from 'lib/service/catalog'
import * as elko from 'lib/service/elko'
import * as log4js from 'log4js'
import * as template from 'management-ui/template'

const SCHEMA = `tags: [string] @count @index(term) .
title: string @index(fulltext) .
shortDescription: string .
uri: string .
`

const logger = log4js.getLogger('controllers/course')

export let index = async (req: Request, res: Response) => {
	await catalog.setSchema(elko.context(), {schema: SCHEMA})

	const result = await catalog.listAll(elko.context(), {})

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

export let resetCourses = async (req: Request, res: Response) => {
	await catalog.setSchema(elko.context(), {schema: SCHEMA})
	await catalog.wipe(elko.context())

	const tags = ['profession:commercial', 'department:cshr', 'grade:aa']
	const mandatoryTags = [...tags, 'mandatory']

	const BASE_COURSES = [
		{
			shortDescription:
				'For anyone who handles information and needs to share and protect it.',
			tags: mandatoryTags,
			title: 'Responsible for information: general user',
		},
		{
			shortDescription:
				'Helps you to understand unconscious bias and how it affects attitudes, behaviours and decision-making.',
			tags: mandatoryTags,
			title: 'Unconcious bias',
		},
		{
			shortDescription:
				'Everyone needs to be able to identify, manage and control health and safety risks in the workplace.',
			tags: mandatoryTags,
			title: 'Health and safety awareness for all staff',
		},
		{
			shortDescription:
				'Gives you the knowledge to recognise different types of disability and the confidence to respond to the needs of disabled colleagues.',
			tags: mandatoryTags,
			title: 'Disability awareness',
		},
		{
			shortDescription:
				'An introduction to workplace diversity and an overview of equality legislation.',
			tags: mandatoryTags,
			title: 'Equality and diversity essentials',
		},
		{
			shortDescription:
				'This course provides a basic knowledge of fire prevention in the office and the dangers of fire.',
			tags: mandatoryTags,
			title: 'Basic fire awareness for all staff',
		},
		{
			shortDescription:
				'Information and guidance pack covers the course aims and outcomes, as well as costs and the cancellation policy.',
			tags: [...tags, 'resource'],
			title: 'Early market engagement',
		},
		{
			shortDescription:
				'Helps you take a wider perspective on your work - developing your ability to see the bigger picture, to put your own work in context and to see the interconnections',
			tags: [...tags, 'grade:g7'],
			title: 'Operating strategically',
		},
		{
			shortDescription:
				'Reduces unnecessary complexity and wasteful procurement, by providing faster procurement that costs less to the taxpayer.',
			tags: [...tags, 'grade:aa', 'grade:eo', 'grade:heo', 'grade:g7'],
			title: 'Lean sourcing',
		},
		{
			shortDescription:
				'There’s more to the commercial process than simply finding the right supplier and having an appropriate contract in place.',
			tags: [...tags, 'grade:g6'],
			title: 'Commercial cycle 4: contract management',
		},
		{
			shortDescription:
				'An introduction to contract management principles, this course is suitable if you have responsibility for managing contracts or suppliers.',
			tags: [...tags, 'grade:aa', 'grade:eo', 'grade:heo', 'grade:g7'],
			title: 'Managing contractors',
		},
	]

	for (const course of BASE_COURSES) {
		await catalog.add(elko.context(), {entry: course})
	}

	res.redirect('/courses')
}
