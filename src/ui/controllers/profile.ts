import { IsEmail, IsNotEmpty, validate } from 'class-validator'
import { Request, Response } from 'express'
import * as config from 'lib/config'
import { getLogger } from 'lib/logger'
import {User} from 'lib/model'
import {
	patchCivilServantOrganisation,
} from 'lib/service/civilServantRegistry/civilServant/civilServantClient'
import * as _ from 'lodash'

import * as registry from '../../lib/registry'
import * as csrsService from '../../lib/service/civilServantRegistry/csrsService'
import * as template from '../../lib/ui/template'

const logger = getLogger('profile')

const defaultRedirectUrl = '/home'

export function addName(request: Request, response: Response) {
	response.send(
		template.render('profile/name', request, response, {
			originalUrl: request.query.originalUrl,
		})
	)
}

export async function updateName(request: Request, response: Response) {
	const name = request.body.name

	if (!name) {
		response.send(
			template.render('profile/name', request, response, {
				error: true,
				name,
				originalUrl: request.body.originalUrl,
			})
		)
	} else {
		try {
			await registry.patch(
				'/civilServants/' + request.user.userId,
				{
					fullName: request.body.name,
				},
				request.user.accessToken
			)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		setLocalProfile(request, 'givenName', name)

		request.session!.save(() =>
			response.redirect(request.body.originalUrl ? request.body.originalUrl : defaultRedirectUrl)
		)
	}
}

export async function addOrganisation(request: Request, response: Response) {
	const options: {[prop: string]: any} = {}
	const orgDropdown = await csrsService.getOrganisationDropdown(request.user)
	orgDropdown.map(o => {
		options[`/organisationalUnits/${o.id}`] = o.formattedName
	})
	const value = request.user.department
	const flashErrorArray = request.flash('error')
	const flashErrorArraySize = flashErrorArray.length

	if (flashErrorArraySize > 0) {
		response.send(
			template.render('profile/organisation', request, response, {
				error: request.flash('error'),
				inputName: 'organisation',
				label: 'Organisation',
				options: Object.entries(options),
				originalUrl: request.query.originalUrl,
				value,
			})
		)
	} else {
		response.send(
			template.render('profile/organisation', request, response, {
				inputName: 'organisation',
				label: 'Organisation',
				options: Object.entries(options),
				originalUrl: request.query.originalUrl,
				value,
			})
		)
	}
}

export async function updateOrganisation(request: Request, response: Response) {
	const user: User = request.user
	let value: string
	value = request.body.organisation
	if (!value) {
		request.flash('error', request.__('errors.empty-organisation'))
		return request.session!.save(() => {
			response.redirect(`/profile/organisation`)
		})
	}
	const organisationId = Number(value.split("/")[2])

	let organisationalUnit

	try {
		organisationalUnit = await csrsService.getOrganisation(user, organisationId)
	} catch (error) {
		console.log(error)
		throw new Error(error)
	}

	try {
		await patchCivilServantOrganisation(user, organisationalUnit.id)
	} catch (error) {
		console.log(error)
		throw new Error(error)
	}
	setLocalProfile(request, 'department', organisationalUnit.code)
	setLocalProfile(request, 'departmentId', organisationalUnit.id)
	setLocalProfile(request, 'organisationalUnit', organisationalUnit)
	let redirect = defaultRedirectUrl
	if (![undefined, null, 'undefined'].includes(request.body.originalUrl)) {
		redirect = request.body.originalUrl
	}
	request.session!.save(() =>
		response.redirect(redirect)
	)
}

export async function addProfession(request: Request, response: Response) {
	let options: {[prop: string]: any}
	let res: any

	if (request.session!.flash && request.session!.flash.children) {
		options = request.session!.flash.children
	} else {
		res = await registry.getWithoutHal('/professions/tree')
		options = sortList(res.data)
	}

	response.send(
		template.render('profile/profession', request, response, {
			originalUrl: request.query.originalUrl,
			professions: Object.entries(options),
		})
	)
}

export async function updateProfession(request: Request, response: Response) {
	const profession = request.body.profession

	if (!profession) {
		const professions = await getOptions('professions')
		response.send(
			template.render('profile/profession', request, response, {
				error: true,
				originalUrl: request.body.originalUrl,
				profession,
				professions: Object.entries(professions),
			})
		)
	} else {
		const professionsTree: any = await registry.getWithoutHal('/professions/tree')
		const options: any = sortList(professionsTree.data)
		let children: any = []

		const areaOfWorkId = profession.split('/professions/').pop()
		options.forEach((option: any) => {
			option.children.forEach((child: any) => {
				// tslint:disable-next-line
				if (child.id == areaOfWorkId && child.children) {
					children = child.children
				}
			})
			// tslint:disable-next-line
			if (option.id == areaOfWorkId && option.children) {
				children = option.children
			}
		})
		if (children.length > 0) {
			request.session!.flash = {children}
			return request.session!.save(() => {
				response.redirect(`/profile/profession?originalUrl=${request.body.originalUrl}`)
			})
		}
		if (request.session!.flash && request.session!.flash.children) {
			delete request.session!.flash.children
		}
		try {
			await registry.patch(
				'/civilServants/' + request.user.userId,
				{
					profession,
				},
				request.user.accessToken
			)
		} catch (error) {
			throw new Error(error)
		}

		try {
			const professionResponse: any = await registry.getWithoutHal(profession.replace(config.REGISTRY_SERVICE_URL, ''))
			const data = professionResponse.data

			setLocalProfile(request, 'areasOfWork', {id: data.id, name: data.name})
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		request.session!.save(() =>
			response.redirect(request.body.originalUrl ? request.body.originalUrl : defaultRedirectUrl)
		)
	}
}

export async function addOtherAreasOfWork(request: Request, response: Response) {
	const professionsTree: any = await registry.getWithoutHal('/professions/tree')
	const professions = sortList(professionsTree.data)
	response.send(
		template.render('profile/otherAreasOfWork', request, response, {
			originalUrl: request.query.originalUrl,
			professions,
		})
	)
}

export async function updateOtherAreasOfWork(request: Request, response: Response) {
	const otherAreasOfWork = request.body.otherAreasOfWork

	if (!otherAreasOfWork) {
		const professions = await getOptions('professions')
		response.send(
			template.render('profile/otherAreasOfWork', request, response, {
				error: true,
				originalUrl: request.body.originalUrl,
				professions,
			})
		)
	} else {
		const values: string[] = [].concat(otherAreasOfWork).map(value => {
			return '/professions/' + value
		})
		try {
			await registry.patch(
				'/civilServants/' + request.user.userId,
				{
					otherAreasOfWork: values,
				},
				request.user.accessToken
			)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		try {
			const professions = []
			for (const profession of values) {
				const professionResponse: any = await registry.getWithoutHal(profession)
				professions.push({
					id: professionResponse.data.id,
					name: professionResponse.data.name,
				})
			}

			setLocalProfile(request, 'otherAreasOfWork', professions)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		request.session!.save(() => response.redirect(`/profile/interests?originalUrl=${request.body.originalUrl}`))
	}
}

export async function addInterests(request: Request, response: Response) {
	const interests = await getOptions('interests')
	response.send(
		template.render('profile/interests', request, response, {
			interests,
			originalUrl: request.query.originalUrl,
		})
	)
}

export async function updateInterests(request: Request, response: Response) {
	const interests = request.body.interests

	if (interests) {
		const values: string[] = [].concat(interests)
		try {
			await registry.patch(
				'/civilServants/' + request.user.userId,
				{
					interests: values,
				},
				request.user.accessToken
			)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		try {
			const updatedInterests = []
			for (const interest of values) {
				const interestResponse: any = await registry.getWithoutHal(interest.replace(config.REGISTRY_SERVICE_URL, ''))
				updatedInterests.push({name: interestResponse.data.name})
			}
			setLocalProfile(request, 'interests', updatedInterests)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}
	}
	request.session!.save(() => response.redirect(`/profile/grade?originalUrl=${request.body.originalUrl}`))
}

export async function addGrade(request: Request, response: Response) {
	const grades = await getOptions('grades')
	response.send(
		template.render('profile/grade', request, response, {
			grades,
			originalUrl: request.query.originalUrl,
		})
	)
}

export async function updateGrade(request: Request, response: Response) {
	const grade = request.body.grade

	if (grade) {
		try {
			await registry.patch(
				'/civilServants/' + request.user.userId,
				{
					grade,
					originalUrl: request.body.originalUrl,
				},
				request.user.accessToken
			)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		try {
			const gradeResponse: any = await registry.getWithoutHal(grade.replace(config.REGISTRY_SERVICE_URL, ''))
			setLocalProfile(request, 'grade', {
				code: gradeResponse.data.code,
				name: gradeResponse.data.name,
			})
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}
	}
	request.session!.save(() => response.redirect(`/profile/lineManager?originalUrl=${request.body.originalUrl}`))
}

export function addLineManager(request: Request, response: Response) {
	response.send(
		template.render('profile/lineManager', request, response, {
			originalUrl: request.query.originalUrl,
		})
	)
}

export async function updateLineManager(request: Request, response: Response) {
	const lineManager = new LineManagerForm(request.body)

	if (lineManager.isPresent()) {
		const errors = await lineManager.validate()

		if (errors.length) {
			response.send(
				template.render('profile/lineManager', request, response, {
					confirm: lineManager.confirm,
					email: lineManager.email,
					errors,
					originalUrl: request.body.originalUrl,
				})
			)
			return
		}
		const res: any = await registry.checkLineManager({lineManager: lineManager.email}, request.user.accessToken)
		if (res.status === 404) {
			errors.push('errors.lineManagerMissing')

			response.send(
				template.render('profile/lineManager', request, response, {
					confirm: lineManager.confirm,
					email: lineManager.email,
					errors,
					originalUrl: request.body.originalUrl,
				})
			)
			return
		} else if (res.status === 400) {
			errors.push('errors.lineManagerIsUser')

			response.send(
				template.render('profile/lineManager', request, response, {
					confirm: lineManager.confirm,
					email: lineManager.email,
					errors,
					originalUrl: request.body.originalUrl,
				})
			)
			return
		} else if (res.status === 200) {
			setLocalProfile(request, 'lineManager', {email: lineManager.email})
		} else {
			logger.error(res)
			throw new Error(res)
		}
		setLocalProfile(request, 'lineManager', {email: lineManager.email})
	}

	request.session!.save(() =>
		response.redirect(request.body.originalUrl !== 'undefined' ? request.body.originalUrl : defaultRedirectUrl)
	)
}

export function addEmail(request: Request, response: Response) {
	logger.debug(`User ${request.user.userName} requesting to change email`)
	response.send(template.render('profile/email', request, response))
}

export async function updateEmail(request: Request, response: Response) {
	return response.redirect(config.AUTHENTICATION.serviceUrl + '/account/email')
}

async function getOptions(type: string) {
	return sortList(await registry.halNode(type))
}

function sortList(list: any) {
	return list.sort((a: any, b: any) => {
		if (a.name === "I don't know") {
			return 1
		}
		if (b.name === "I don't know") {
			return -1
		}
		if (a.name < b.name) {
			return -1
		}
		if (a.name > b.name) {
			return 1
		}
		return 0
	})
}

function setLocalProfile(request: Request, key: string, value: any) {
	const user: any = JSON.parse(request.session!.passport.user)
	user[key] = value
	request.session!.passport.user = JSON.stringify(user)

	/* tslint:disable-next-line:no-empty */
	request.session!.save(() => {})
}

class LineManagerForm {
	@IsEmail(
		{},
		{
			message: 'profile.lineManager.email.invalid',
		}
	)
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

	constructor(data: {email: string; confirm: string}) {
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
		return this._email || this._confirm
	}

	async validate() {
		const errors = await validate(this)
		/*tslint:disable*/
		const messages = _.flatten(
			errors.map(error => {
				return Object.values(error.constraints)
			})
		)
		/*tslint:enable*/
		if (this._email !== this._confirm) {
			messages.push('profile.lineManager.confirm.match')
		}

		return messages
	}
}
