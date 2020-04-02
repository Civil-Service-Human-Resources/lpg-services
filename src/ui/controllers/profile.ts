import {IsEmail, IsNotEmpty, validate} from 'class-validator'
import {Request, Response} from 'express'
import * as config from 'lib/config'
import * as identity from 'lib/identity'
import {ForceOrgChange} from "lib/model"
import * as _ from 'lodash'
import * as log4js from 'log4js'
import * as registry from '../../lib/registry'
import * as template from '../../lib/ui/template'

log4js.configure(config.LOGGING)
const logger = log4js.getLogger('profile')

const defaultRedirectUrl = '/home'

export function addName(request: Request, response: Response) {
	response.send(template.render('profile/name', request, response, {
		originalUrl: request.query.originalUrl,
	}))
}

export async function updateName(request: Request, response: Response) {
	const name = request.body.name

	if (!name) {
		response.send(template.render('profile/name', request, response, {
			error: true,
			name,
			originalUrl: request.body.originalUrl,
		}))
	} else {
		try {
			await registry.patch('civilServants', {
				fullName: request.body.name,
			}, request.user.accessToken)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		setLocalProfile(request, 'givenName', name)

		request.session!.save(() =>
			response.redirect((request.body.originalUrl) ? request.body.originalUrl : defaultRedirectUrl)
		)
	}
}

export async function addOrganisation(request: Request, response: Response) {
	const options: { [prop: string]: any } = {}
	const email = request.user.userName
	const domain = email.split("@")[1]
	const organisations: any = await registry.getWithoutHal('/organisationalUnits/flat/' + domain + '/')
	organisations.data.map((x: any) => {
		options[x.href.replace(config.REGISTRY_SERVICE_URL, '')] = x.formattedName
	})

	const value = request.user.department

	response.send(template.render('profile/organisation', request, response, {
		inputName: 'organisation',
		label: 'Organisation',
		options: Object.entries(options),
		originalUrl: request.query.originalUrl,
		value,
	}))
}

export async function enterToken(request: Request, response: Response) {
	response.send(template.render('profile/enterToken', request, response, {
		org: request.body.org,
		organisation: request.body.organisation,
		originalUrl: request.query.originalUrl,
	}))
}

export async function updateOrganisation(request: Request, response: Response) {

	const value = request.body.organisation
	const email = request.user.userName
	const domain = email.split("@")[1]

	if (!value) {
		const options: { [prop: string]: any } = {}

		const organisations: any = await registry.getWithoutHal('/organisationalUnits/flat/' + domain + '/')
		organisations.data.map((x: any) => {
			options[x.href.replace(config.REGISTRY_SERVICE_URL, '')] = x.formattedName
		})

		response.send(template.render('profile/organisation', request, response, {
			error: true,
			inputName: 'organisation',
			label: 'Organisation',
			options: Object.entries(options),
			originalUrl: request.body.originalUrl,
			value,
		}))
	}

	let organisationalUnit

	try {
		const organisationResponse: any = await registry.getWithoutHal(value)
		organisationalUnit = {
			code: organisationResponse.data.code,
			name: organisationResponse.data.name,
			paymentMethods: organisationResponse.data.paymentMethods,
		}
	} catch (error) {
		console.log(error)
		throw new Error(error)
	}

	let isWhitelisted: any = "false"
	let isTokenizedUser: any = false

	try {
		isWhitelisted = identity.isWhitelisted(request.user.accessToken, domain)
	} catch (error) {
		logger.error(error)
		throw new Error(error)
	}

	if (!isWhitelisted) {
		isTokenizedUser = await registry.isTokenizedUser(organisationalUnit.code, domain)
	}

	if (isWhitelisted === "true" && !isTokenizedUser) {

		try {
			await registry.patch('civilServants', {organisationalUnit: request.body.organisation, },
					request.user.accessToken)
		} catch (error) {
			console.log(error)
			throw new Error(error)
		}

		setLocalProfile(request, 'department', organisationalUnit.code)
		setLocalProfile(request, 'organisationalUnit', organisationalUnit)

		let res: any
		const dto = {forceOrgChange: false}

		try {
			res = await registry.updateForceOrgResetFlag(request.user.accessToken, dto)
		} catch (error) {
			console.log(error)
			throw new Error(error)
		}

		if (res.status === 204) {

			setLocalProfile(request, 'forceOrgChange', new ForceOrgChange(false))

			request.session!.save(() =>
					response.redirect((request.body.originalUrl) ? request.body.originalUrl : defaultRedirectUrl)
			)
		} else {
			throw new Error(res)
		}
	} else if (isTokenizedUser) {
			response.send(template.render('profile/enterToken', request, response, {
				org: value,
				organisation: organisationalUnit.name,
				originalUrl: request.body.originalUrl,
			}))
	} else {
		throw new Error("Unexpected user state, user is logged in and is neither whitelisted or tokenized")
	}
}

function displayTokenPage(request: Request, response: Response, errMsg: string, value: string, organisation: string) {
	response.send(template.render(`profile/enterToken`, request, response, {
		error: true,
		msg: errMsg,
		org: value,
		organisation,
		originalUrl: request.body.originalUrl,
	}))
}

export async function checkTokenValidity(request: Request, response: Response) {

	const value = request.body.org
	let organisationalUnit

	try {
		const organisationResponse: any = await registry.getWithoutHal(value)
		organisationalUnit = {
			code: organisationResponse.data.code,
			name: organisationResponse.data.name,
			paymentMethods: organisationResponse.data.paymentMethods,
		}

	} catch (error) {
		throw new Error(error)
	}

	const code = organisationalUnit.code
	const domain = request.user.userName.split("@")[1]
	const token = request.body.token
	const accessToken = request.user.accessToken

	if (!token) {
			displayTokenPage(request, response, "Please don't leave the token blank", value, organisationalUnit.name)
	} else {
		const checkTokenValidResponse: any = await registry.updateToken(code, domain, token, false, accessToken)

		if (checkTokenValidResponse.status === 204) {
			try {
				await registry.patch('civilServants', {
					organisationalUnit: request.body.org,
				}, request.user.accessToken)
			} catch (error) {
				throw new Error(error)
			}

			setLocalProfile(request, 'department', organisationalUnit.code)
			setLocalProfile(request, 'organisationalUnit', organisationalUnit)

			request.session!.save(() =>
					response.redirect((request.body.originalUrl) ? request.body.originalUrl : defaultRedirectUrl)
			)
		} else if (checkTokenValidResponse.status === 404) {
			displayTokenPage(request,
					response,
					"Please make sure you entered the correct token", value, organisationalUnit.name)
		} else if (checkTokenValidResponse.status === 409) {
			displayTokenPage(request,
					response,
					"Sorry, there is no enough spaces. Contact the office", value, organisationalUnit.name)
		} else {
			displayTokenPage(request,
					response,
					"Sorry, something went wrong. We are working on it", value, organisationalUnit.name)
		}
	}
}

export async function addProfession(request: Request, response: Response) {

	let options: { [prop: string]: any }
	let res: any

	if (request.session!.flash && request.session!.flash.children) {
		options = request.session!.flash.children
	} else {
		res = await registry.getWithoutHal('/professions/tree')
		options = sortList(res.data)
	}

	response.send(template.render('profile/profession', request, response, {
				originalUrl: request.query.originalUrl,
				professions: Object.entries(options),
			})
	)
}

export async function updateProfession(request: Request, response: Response) {
	const profession = request.body.profession

	if (!profession) {
		const professions = await getOptions("professions")
		response.send(template.render('profile/profession', request, response, {
			error: true,
			originalUrl: request.body.originalUrl,
			profession,
			professions,
		}))
	} else {
		const professionsTree: any = await registry.getWithoutHal('/professions/tree')
		const options: any = sortList(professionsTree.data)
		let children: any = []

		const areaOfWorkId = profession.split("/professions/").pop()
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
			await registry.patch('civilServants', {
				profession,
			}, request.user.accessToken)
		} catch (error) {
			throw new Error(error)
		}

		try {
			const professionResponse: any = await registry.getWithoutHal(profession.replace(config.REGISTRY_SERVICE_URL, ''))
			const data = professionResponse.data

			setLocalProfile(request, 'areasOfWork', [data.id, data.name])
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		request.session!.save(() =>
				response.redirect((request.body.originalUrl) ? request.body.originalUrl : defaultRedirectUrl)
		)
	}
}

export async function addOtherAreasOfWork(request: Request, response: Response) {
	const professionsTree: any = await registry.getWithoutHal('/professions/tree')
	const professions = sortList(professionsTree.data)
	response.send(template.render('profile/otherAreasOfWork', request, response, {
		originalUrl: request.query.originalUrl,
		professions,
	}))
}

export async function updateOtherAreasOfWork(request: Request, response: Response) {
	const otherAreasOfWork = request.body.otherAreasOfWork

	if (!otherAreasOfWork) {
		const professions = await getOptions("professions")
		response.send(template.render('profile/otherAreasOfWork', request, response, {
			error: true,
			originalUrl: request.body.originalUrl,
			professions,
		}))
	} else {
		const values: string[] = [].concat(otherAreasOfWork).map(value => {
			return "/professions/" + value
		})
		try {
			await registry.patch('civilServants', {
				otherAreasOfWork: values,
			}, request.user.accessToken)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		try {
			const professions = []
			for (const profession of values) {
				const professionResponse: any = await registry.getWithoutHal(profession)
				professions.push({id: professionResponse.data.id, name: professionResponse.data.name})
			}

			setLocalProfile(request, 'otherAreasOfWork', professions)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		request.session!.save(() =>
				response.redirect(`/profile/interests?originalUrl=${request.body.originalUrl}`)
		)
	}
}

export async function addInterests(request: Request, response: Response) {
	const interests = await getOptions("interests")
	response.send(template.render('profile/interests', request, response, {
		interests,
		originalUrl: request.query.originalUrl,
	}))
}

export async function updateInterests(request: Request, response: Response) {
	const interests = request.body.interests

	if (interests) {
		const values: string[] = [].concat(interests)
		try {
			await registry.patch('civilServants', {
				interests: values,
			}, request.user.accessToken)
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
	request.session!.save(() =>
			response.redirect(`/profile/grade?originalUrl=${request.body.originalUrl}`)
	)
}

export async function addGrade(request: Request, response: Response) {
	const grades = await getOptions('grades')
	response.send(template.render('profile/grade', request, response, {
		grades,
		originalUrl: request.query.originalUrl,
	}))
}

export async function updateGrade(request: Request, response: Response) {
	const grade = request.body.grade

	if (grade) {
		try {
			await registry.patch('civilServants', {
				grade,
				originalUrl: request.body.originalUrl,
			}, request.user.accessToken)
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}

		try {
			const gradeResponse: any = await registry.getWithoutHal(grade.replace(config.REGISTRY_SERVICE_URL, ''))
			setLocalProfile(request, 'grade', {code: gradeResponse.data.code, name: gradeResponse.data.name})
		} catch (error) {
			logger.error(error)
			throw new Error(error)
		}
	}
	request.session!.save(() =>
			response.redirect(`/profile/lineManager?originalUrl=${request.body.originalUrl}`)
	)
}

export function addLineManager(request: Request, response: Response) {
	response.send(template.render('profile/lineManager', request, response, {
		originalUrl: request.query.originalUrl,
	}))
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
				originalUrl: request.body.originalUrl,
			}))
			return
		}
		const res: any = await registry.checkLineManager({lineManager: lineManager.email}, request.user.accessToken)
		if (res.status === 404) {
			errors.push("errors.lineManagerMissing")

			response.send(template.render('profile/lineManager', request, response, {
				confirm: lineManager.confirm,
				email: lineManager.email,
				errors,
				originalUrl: request.body.originalUrl,
			}))
			return
		} else if (res.status === 400) {
			errors.push('errors.lineManagerIsUser')

			response.send(template.render('profile/lineManager', request, response, {
				confirm: lineManager.confirm,
				email: lineManager.email,
				errors,
				originalUrl: request.body.originalUrl,
			}))
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
			response.redirect((request.body.originalUrl !== "undefined") ? request.body.originalUrl : defaultRedirectUrl)
	)
}

export function addEmail(request: Request, response: Response) {
	response.send(template.render('profile/email', request, response, {
		originalUrl: request.query.originalUrl,
	}))
}

export async function updateEmail(request: Request, response: Response) {
	try {
		const email = request.user.userName
		const oldDomain = email.split("@")[1]
		await identity.isWhitelisted(request.user.accessToken, oldDomain)
		.then(e => {
			if (e.status === 200) {
				if (e === "false") {
					adjustTokenQuota(request, oldDomain)
				}
			}
		})
		.catch(error => {
			logger.error(error)
			throw new Error(error)
		})
		const dto = {forceOrgChange: true}
		const res: any = await registry.updateForceOrgResetFlag(request.user.accessToken, dto)
		if (res.status === 204) {
			setLocalProfile(request, 'department', null)
			setLocalProfile(request, 'organisationalUnit', null)
			setLocalProfile(request, 'forceOrgChange', true)
			const changeEmailURL = new URL('/account/email', config.AUTHENTICATION.serviceUrl)
			request.login(request.user, () => {
				request.session!.save(() =>
						response.redirect(changeEmailURL.toString())
				)
			})
		}
	} catch (error) {
		logger.error(error)
		throw new Error(error)
	}
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
	request.session!.save(() => {
	})
}

function adjustTokenQuota(request: Request, oldDomain: string) {
	const oldOrgCodeResponse: any = registry.getOrgCode(request.user.accessToken)
	if (oldOrgCodeResponse.status === 404) {
		console.log("org code not found")
		throw new Error("Org code not found")
	} else {
		const oldOrgCode = oldOrgCodeResponse.toString()
		// tslint:disable-next-line:max-line-length
		const oldTokenResponse: any = registry.getAgencyTokenByDomainAndOrgCode(request.user.accessToken, oldDomain, oldOrgCode)
		if (oldTokenResponse.status === 404) {
			console.log("token not found")
			throw new Error("token not found")
		} else {
			const oldToken: string = oldTokenResponse.data.token
			const quotaDTO = {domain: oldDomain, token: oldToken, code: oldOrgCode, removeUser: true}
			registry.updateAvailableSpacesOnAgencyToken(request.user.accessToken, quotaDTO)
		}
	}
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

	constructor(data: { email: string, confirm: string }) {
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
		/*tslint:disable*/
		const messages = _.flatten(errors.map(error => {
			return Object.values(error.constraints)
		}))
		/*tslint:enable*/
		if (this._email !== this._confirm) {
			messages.push("profile.lineManager.confirm.match")
		}

		return messages
	}

}
