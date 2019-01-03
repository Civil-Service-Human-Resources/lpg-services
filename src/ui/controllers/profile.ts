/* tslint:disable */
import {Request, Response} from 'express'
import * as registry from '../../lib/registry'
import * as template from '../../lib/ui/template'

export function addName(request: Request, response: Response) {
	response.send(template.render('profile/name', request, response, {}))
}

export async function updateName(request: Request, response: Response) {
	const name = request.body.name

	if (!name) {
		response.send(template.render('profile/name', request, response, {
			error: true,
			name,
		}))
	}

	try {
		await registry.patch('civilServants', {
			fullName: request.body.name,
		}, request.user.accessToken)
	} catch (error) {
		throw new Error(error)
	}
	response.send(template.render('profile/name', request, response, {
		name,
	}))
}

export function addOrganisation(request: Request, response: Response) {
	response.send(template.render('profile/organisation', request, response, {}))
}

export async function updateOrganisation(request: Request, response: Response) {
	const organisation = request.body.organisation

	if (!organisation) {
		response.send(template.render('profile/organisation', request, response, {
			error: true,
			organisation,
		}))
	}

	try {
		await registry.patch('civilServants', {
			organisationalUnit: request.body.organisation,
		}, request.user.accessToken)
	} catch (error) {
		throw new Error(error)
	}
	response.send(template.render('profile/organisation', request, response, {
		organisation,
	}))
}

export async function addProfession(request: Request, response: Response) {
	const professions = await registry.halNode("professions")
	response.send(template.render('profile/profession', request, response, {
		professions
	}))
}

export async function updateProfession(request: Request, response: Response) {
	const profession = request.body.profession

	try {
		await registry.patch('civilServants', {
			profession,
		}, request.user.accessToken)
	} catch (error) {
		throw new Error(error)
	}
	response.send(template.render('profile/profession', request, response, {
		profession,
	}))
}

export async function addOtherAreasOfWork(request: Request, response: Response) {
	const professions = await registry.halNode("professions")
	response.send(template.render('profile/otherAreasOfWork', request, response, {
		professions
	}))
}

export async function updateOtherAreasOfWork(request: Request, response: Response) {
	const otherAreasOfWork = request.body.otherAreasOfWork

	try {
		await registry.patch('civilServants', {
			otherAreasOfWork
		}, request.user.accessToken)
	} catch (error) {
		throw new Error(error)
	}

	response.send(template.render('profile/otherAreasOfWork', request, response, {
		otherAreasOfWork
	}))
}

export async function addInterests(request: Request, response: Response) {
	const interests = await registry.halNode("interests")
	response.send(template.render('profile/interests', request, response, {
		interests
	}))
}

export async function updateInterests(request: Request, response: Response) {
	const interests = request.body.interests

	try {
		await registry.patch('civilServants', {
			interests
		}, request.user.accessToken)
	} catch (error) {
		throw new Error(error)
	}

	response.send(template.render('profile/interests', request, response, {
		interests
	}))
}

export async function addGrade(request: Request, response: Response) {
	const grades = await registry.halNode("grades")
	response.send(template.render('profile/grade', request, response, {
		grades
	}))
}

export async function updateGrade(request: Request, response: Response) {
	const grade = request.body.grade

	try {
		await registry.patch('civilServants', {
			grade,
		}, request.user.accessToken)
	} catch (error) {
		throw new Error(error)
	}
	response.send(template.render('profile/grade', request, response, {
		grade,
	}))
}