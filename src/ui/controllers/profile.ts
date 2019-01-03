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
			organisation: organisation,
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
		name: organisation,
	}))
}