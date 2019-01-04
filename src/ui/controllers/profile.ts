import {IsEmail, IsNotEmpty, validate} from 'class-validator'
import {Request, Response} from 'express'
import * as _ from 'lodash'
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
		return
	} else {
		try {
			await registry.patch('civilServants', {
				fullName: request.body.name,
			}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}

		request.session!.save(() =>
			response.redirect('/profile/organisation')
		)
	}
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
		return
	} else {
		try {
			await registry.patch('civilServants', {
				organisationalUnit: request.body.organisation,
			}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}
		request.session!.save(() =>
			response.redirect('/profile/profession')
		)
	}
}

export async function addProfession(request: Request, response: Response) {
	const professions = await getOptions("professions")

	response.send(template.render('profile/profession', request, response, {
		professions,
	}))
}

export async function updateProfession(request: Request, response: Response) {
	const profession = request.body.profession

	if (!profession) {
			const professions = await getOptions("professions")
			response.send(template.render('profile/profession', request, response, {
				error: true,
				profession,
				professions,
			}))
	} else {
		try {
			await registry.patch('civilServants', {
				profession,
			}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}

		request.session!.save(() =>
			response.redirect('/profile/otherAreasOfWork')
		)
	}
}

export async function addOtherAreasOfWork(request: Request, response: Response) {
	const professions = await getOptions("professions")
	response.send(template.render('profile/otherAreasOfWork', request, response, {
		professions,
	}))
}

export async function updateOtherAreasOfWork(request: Request, response: Response) {
	const otherAreasOfWork = request.body.otherAreasOfWork

	if (!otherAreasOfWork) {
		const professions = await getOptions("professions")
		response.send(template.render('profile/otherAreasOfWork', request, response, {
			error: true,
			professions,
		}))
	} else {
		try {
			await registry.patch('civilServants', {
				otherAreasOfWork,
			}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}

		request.session!.save(() =>
			response.redirect('/profile/interests')
		)
	}
}

export async function addInterests(request: Request, response: Response) {
	const interests = await getOptions("interests")
	response.send(template.render('profile/interests', request, response, {
		interests,
	}))
}

export async function updateInterests(request: Request, response: Response) {
	const interests = request.body.interests

	if (!interests) {
		const options = await getOptions("interests")
		response.send(template.render('profile/interests', request, response, {
			error: true,
			interests: options,
		}))
	} else {
		try {
			await registry.patch('civilServants', {
				interests,
			}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}
		request.session!.save(() =>
			response.redirect('/profile/grade')
		)
	}
}

export async function addGrade(request: Request, response: Response) {
	const grades = await getOptions('grades')
	response.send(template.render('profile/grade', request, response, {
		grades,
	}))
}

export async function updateGrade(request: Request, response: Response) {
	const grade = request.body.grade

	if (grade) {
		try {
			await registry.patch('civilServants', {
				grade,
			}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}
	}
	request.session!.save(() =>
		response.redirect('/profile/lineManager')
	)
}

export function addLineManager(request: Request, response: Response) {
	response.send(template.render('profile/lineManager', request, response, {}))
}

export async function updateLineManager(request: Request, response: Response) {
	const lineManager = new LineManagerForm(request.body)

	if (lineManager.isPresent()) {
		const errors = await lineManager.validate()

		if (errors.length) {
			response.send(template.render('profile/lineManager', request, response, {
				confirm: lineManager.confirm,
				email: lineManager.email,
				errors,
			}))
			return
		}

		try {
			await registry.checkLineManager({lineManager: lineManager.email}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}
	}

	request.session!.save(() =>
		response.redirect('/home')
	)
}

async function getOptions(type: string) {
	return sortList(await registry.halNode(type))
}

function sortList(list: any) {
	return list.sort((a: any, b: any) => {
		if (a.name === "I don't know") { return 1 }
		if (b.name === "I don't know") { return -1 }
		if (a.name < b.name) { return -1 }
		if (a.name > b.name) { return 1 }
		return 0
	})
}

class LineManagerForm {
	@IsEmail({}, {
		message: 'profile.lineManager.email.invalid',
	})
	@IsNotEmpty({
		message: 'profile.lineManager.email.empty',
	})
	/* tslint:disable-next-line:variable-name */
	private readonly _email: string

	@IsNotEmpty({
		message: 'profile.lineManager.confirm.empty',
	})
	/* tslint:disable-next-line:variable-name */
	private readonly _confirm: string

	constructor(data: {email: string, confirm: string}) {
		this._email = data.email
		this._confirm = data.confirm
	}

	get email(): string {
		return this._email
	}

	get confirm(): string {
		return this._confirm
	}

	isPresent() {
		return (this._email || this._confirm)
	}

	async validate() {
		const errors = await validate(this)
		const messages = _.flatten(errors.map(error => {
			return Object.values(error.constraints)
		}))

		if (this._email !== this._confirm) {
			messages.push("profile.lineManager.confirm.match")
		}

		return messages
	}
}
