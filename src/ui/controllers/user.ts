import axios from 'axios'
import * as express from 'express'
import * as https from 'https'
import * as axiosLogger from 'lib/axiosLogger'
import * as config from 'lib/config'
import * as passport from 'lib/config/passport'
import * as extended from 'lib/extended'
import { getLogger } from 'lib/logger'
import * as model from 'lib/model'
import * as registry from 'lib/registry'
import * as template from 'lib/ui/template'

import * as csrsService from '../../lib/service/civilServantRegistry/csrsService'

export interface Profile {
	updateSuccessful: boolean
	user: model.User
	identityServerFailed?: boolean
	validFields?: boolean
	passwordConfirmedFailed?: boolean
}

export interface SignIn {
	loginFailed: boolean
	sessionDataKey: string
	authenticationServiceUrl: string
}

export enum nodes {
	'given-name' = 'fullName',
	'email-addresss' = 'emailAddress',
	'department' = 'organisationalUnit',
	'grade' = 'grade',
	'interest' = 'interests',
	'primary-area-of-work' = 'profession',
	'other-areas-of-work' = 'otherAreasOfWork',
	'line-manager' = 'lineManager',
	'password' = 'password',
}

function getNodeByName(name: string) {
	const keys = Object.keys(nodes)
	let node = ''
	keys.forEach((element, index) => {
		if (element === name) {
			node = Object.values(nodes)[index]
		}
	})

	return node
}

const logger = getLogger('controllers/user')

// This super slick regex is by Andrew Clark from:
// https://stackoverflow.com/questions/6739676/regular-expression-matching-at-least-n-of-m-groups
//
// Keep it in sync with the regex on WSO2.

const validPassword = /(?!([a-zA-Z]*|[a-z\d]*|[^A-Z\d]*|[A-Z\d]*|[^a-z\d]*|[^a-zA-Z]*)$).{8,}/

// This slick super regex is from http://emailregex.com/

/* tslint:disable:max-line-length */
const validEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
/* tslint:enable */

const http = axios.create({
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
		rejectUnauthorized: false,
	}),
	timeout: config.REQUEST_TIMEOUT,
})
axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

function renderSignIn(req: express.Request, res: express.Response, props: SignIn) {
	return template.render('account/sign-in', req, res, props)
}

async function updateUserObject(req: express.Request, updatedProfile: Record<string, string>) {
	const newUser = model.User.create({
		...req.user,
		...updatedProfile,
	})

	await new Promise(resolve => {
		req.login(newUser, () => {
			req.session!.save(resolve)
		})
	})
}

function validateForm(req: express.Request) {
	const form = req.body
	delete form._csrf

	let validFields = true

	for (const input of Object.keys(form)) {
		if (!/\S/.test(form[input])) {
			form[input] = ''
			validFields = false
		}
	}
	if (Object.keys(form).length === 0) {
		validFields = false
	}
	return validFields
}

export function viewProfile(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	if (ireq.session!.flash && ireq.session!.flash.children) {
		delete ireq.session!.flash.children
	}
	res.send(
		template.render('profile/view', req, res, {
			updateSuccessful: req.flash('profile-updated').length > 0,
			user: req.user,
			validFields: true,
		})
	)
}

export enum OptionTypes {
	Radio = 'radio',
	Checkbox = 'checkbox',
	Typeahead = 'typeahead',
	Confirm = 'confirm',
}

export interface Level {
	url: string
	name: string
}

export function haltoObject(traversonResult: any[]): {} {
	const data = traversonResult.map((x: any) => {
		const hash: Record<string, string> = {}
		hash[x.name] = x._links.self.href.replace(config.REGISTRY_SERVICE_URL, '')

		return hash
	})

	const out: Record<string, string> = {}

	for (const item of data) {
		const keys = Object.keys(item)
		out[item[keys[0]]] = keys[0]
	}
	return out
}

export async function renderEditPage(req: express.Request, res: express.Response) {
	const inputName = req.params.profileDetail
	let options: {[prop: string]: any} = {}
	let optionType: string = ''
	let value = null
	let lede
	let response: any
	switch (inputName) {
		case 'given-name':
			value = req.user.givenName
			break
		case 'primary-area-of-work':
			lede = req.__('register_area_page_intro')
			// options = haltoObject(await registry.halNode('professions'))
			if (req.session!.flash.children) {
				options = req.session!.flash.children
			} else {
				response = await registry.getWithoutHal('/professions/tree')
				options = sortList(response.data)
			}
			optionType = OptionTypes.Radio
			value = req.user.areasOfWork
			break
		case 'other-areas-of-work':
			lede = 'Select any other areas of work.'
			response = await registry.getWithoutHal('/professions/tree')
			sortList(response.data).map((x: any) => {
				options['/professions/' + x.id] = x.name
			})
			if (req.user.otherAreasOfWork) {
				value = req.user.otherAreasOfWork.map((otherAreasOfWork: {name: string}) => {
					return otherAreasOfWork.name
				})
			}

			optionType = OptionTypes.Checkbox

			break
		case 'department':
			const orgDropdown = await csrsService.getOrganisationDropdown(req.user)
			orgDropdown.map(o => {
				options[`/organisationalUnits/${o.id}`] = o.formattedName
			})
			value = req.user.department
			optionType = OptionTypes.Typeahead
			break
		case 'grade':
			lede = 'Please select your grade'
			options = haltoObject(await registry.halNode('grades'))
			optionType = OptionTypes.Radio
			value = req.user.grade ? req.user.grade.name : ''
			break
		case 'name':
			value = req.user.name
			break
		case 'interest':
			lede = 'Please select your interests'
			options = haltoObject(await registry.halNode('interests'))
			optionType = OptionTypes.Checkbox
			value = req.user.interests.map((interest: {name: string}) => {
				return interest.name
			})
			break
	}

	res.send(
		template.render('profile/edit', req, res, {
			...res.locals,
			error: req.flash('profileError')[0],
			errorEmpty: req.flash('profileErrorEmpty')[0],
			inputName,
			lede,
			optionType,
			options: Object.entries(options),
			value,
		})
	)
}

export function resetPassword(req: express.Request, res: express.Response) {
	res.send(template.render('account/reset-password', req, res))
}

export function signIn(req: express.Request, res: express.Response) {
	req.logout()
	const sessionDataKey = req.query.sessionDataKey
	const loginFailed = req.query.authFailureMsg === 'login.fail.message'

	if (req.isAuthenticated()) {
		res.redirect('/')
	} else if (!sessionDataKey) {
		res.redirect('/authenticate')
	} else {
		res.send(
			// @ts-ignore
			renderSignIn(req, res, {
				authenticationServiceUrl: config.AUTHENTICATION.serviceUrl,
				loginFailed,
				sessionDataKey,
			})
		)
	}
}

export async function signOut(req: express.Request, res: express.Response) {
	if (req.isAuthenticated()) {
		if (req.user.isAdmin()) {
			const callbackURL = config.LPG_MANAGEMENT_URL + "/log-out"
			await passport.logout(config.AUTHENTICATION.serviceUrl, callbackURL, req, res, req.user.accessToken)
		} else {
			await passport.logout(config.AUTHENTICATION.serviceUrl, config.LPG_UI_SERVER, req, res, req.user.accessToken)
		}
	} else {
		res.redirect(config.LPG_UI_SERVER)
	}
}

export async function tryUpdateProfile(req: express.Request, res: express.Response) {
	const validFields = validateForm(req)

	if (req.body['primary-area-of-work']) {
		const areaOfWork = req.body['primary-area-of-work']

		const response: any = await registry.getWithoutHal('/professions/tree')
		const options: any = response.data
		let children: any = []

		const areaOfWorkId = areaOfWork.split('/professions/').pop()
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
			req.session!.flash = {children}
			return req.session!.save(() => {
				res.redirect('/profile/primary-area-of-work')
			})
		}
		delete req.session!.flash.children
	}

	if (!validFields) {
		req.flash('profileErrorEmpty', req.__('errors.profileErrorEmpty'))
		return req.session!.save(() => {
			res.redirect(`/profile/${req.params.profileDetail}`)
		})
	} else {
		await updateProfile(req, res)
	}
}
export async function patchAndUpdate(
	node: string,
	value: string,
	input: string,
	req: express.Request,
	res: express.Response
) {
	const call: Record<string, string> = {}
	call[node] = value
	const response =
		node !== 'lineManager'
			? await registry.patch('/civilServants/' + req.user.userId, call, req.user.accessToken)
			: await registry.checkLineManager(call, req.user.accessToken)

	const responseStatus = (response as any).status || (response as any).statusCode
	const requestWasSuccessful = responseStatus === 200

	if (node === 'lineManager' && !requestWasSuccessful) {
		const inputName = 'line-manager'
		let errorMessage = null

		switch (responseStatus) {
			case 404:
				errorMessage = req.__('errors.lineManagerMissing')
				break
			case 400:
				errorMessage = req.__('errors.lineManagerIsUser')
				break
		}

		if (errorMessage) {
			req.flash('profileError', errorMessage)
			return req.session!.save(() => {
				res.redirect(`/profile/${inputName}`)
			})
		}
	} else if (requestWasSuccessful) {
		// seems like we have to get the profile again to get values
		// which seems ...not good
		const profile = await registry.profile(req.user.accessToken)
		await updateUserObject(req, profile as Record<string, string>)
		req.flash('profile-updated', 'profile-updated')
		return req.session!.save(() => {
			res.redirect('/profile')
		})
	} else {
		req.flash(
			'profileError',
			`Server error. Update failed, please try again or contact the
<a href="mailto:feedback@cslearning.gov.uk">Civil Service Learning Team</a>`
		)
		return req.session!.save(() => {
			res.redirect(`/profile/${input}`)
		})
	}
}

export async function updateProfile(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest

	let inputName = req.params.profileDetail
	let fieldValue = req.body[inputName]

	const node = getNodeByName(inputName)

	let errorMessage = ''

	switch (node) {
		case 'interests':
			if (!Array.isArray(fieldValue)) {
				fieldValue = [fieldValue]
			}
			break
		case 'otherAreasOfWork':
			if (!Array.isArray(fieldValue)) {
				fieldValue = [fieldValue]
			}
			break
		case 'profession':
			if (Array.isArray(fieldValue)) {
				inputName = 'areasOfWork'
				fieldValue = fieldValue.join(',')
			}
			break
		case 'lineManager':
			if (fieldValue !== req.body.confirmLineManager) {
				errorMessage = req.__('errors.lineManagerConfirmation')
			} else if (!validEmail.exec(fieldValue)) {
				errorMessage = req.__('errors.lineManagerInvalid')
			}
			break
		case 'password':
			if (fieldValue !== req.body.confirmPassword) {
				errorMessage = req.__('errors.passwordUnmatched')
			} else if (fieldValue.length < 8) {
				errorMessage = req.__('errors.passwordLength')
			} else if (!validPassword.exec(fieldValue)) {
				errorMessage = req.__('errors.passwordNotMetReq')
			}

			break
	}

	if (errorMessage) {
		req.flash('profileError', errorMessage)
		req.session!.save(() => {
			res.redirect(`/profile/${inputName}`)
		})
		return
	}

	if (node in ['password']) {
		// do something with identity
	} else {
		await patchAndUpdate(node, fieldValue, inputName, req, res)
	}
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
