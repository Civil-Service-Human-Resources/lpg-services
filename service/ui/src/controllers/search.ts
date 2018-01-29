import {Request, Response} from 'express'
import {Profile} from 'ui/controllers/user'
import * as template from 'ui/template'
import * as catalog from 'ui/service/catalog'
import * as elko from 'ui/service/elko'
const SCHEMA = `tags: [string] @count @index(exact) .
shortDescription: string .
title: string @index(fulltext) .
uri: string .
`

export let index = (req: Request, res: Response) => {
	let profile: Profile = {user: req.user}
	if (!req.user.profession) {
		res.redirect('/profile')
	} else {
		res.send(renderSearch(req, profile))
	}
}

function renderSearch(req: Request, props: Profile) {
	return template.render('search', req, props)
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
			tags: [...tags, 'grade:g6', 'suggested'],
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
}

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
		course => course.tags == 'suggested'
	)

	return {
		mandatory: mandatory,
		suggested: suggested,
	}
}

export let listAllCourses = async (req: Request, res: Response) => {
	await resetCourses(req, res)
	await catalog.setSchema(elko.context(), {schema: SCHEMA})
	let result = await catalog.listAll(elko.context(), {})
	console.log(result)
	let filteredResult = filterCourses(result)

	res.send(renderLearningPlan(req, filteredResult))
}

function renderLearningPlan(req: Request, props: LearningPlan) {
	return template.render('search', req, props)
}
