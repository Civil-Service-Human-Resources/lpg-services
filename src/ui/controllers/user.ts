import axios from 'axios'
import * as express from 'express'
import * as https from 'https'
import * as log4js from 'log4js'

import * as axiosLogger from 'lib/axiosLogger'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'

import * as config from 'lib/config'
import * as passport from 'lib/config/passport'

/*tslint:disable*/
const JsonHalAdapter = require('traverson-hal')
const traverson = require('traverson-promise')
/*tslint:enable*/

traverson.registerMediaType(JsonHalAdapter.mediaType, JsonHalAdapter)

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

interface WSO2Profile {
	CshrUser: {
		department: string
		grade: string
		profession: string
	}
	name: {
		givenName: string
	}
	userName: string
	password?: string
}

const logger = log4js.getLogger('controllers/user')

// This super slick regex is by Andrew Clark from:
// https://stackoverflow.com/questions/6739676/regular-expression-matching-at-least-n-of-m-groups
//
// Keep it in sync with the regex on WSO2.
const validPassword = /(?!([a-zA-Z]*|[a-z\d]*|[^A-Z\d]*|[A-Z\d]*|[^a-z\d]*|[^a-zA-Z]*)$).{8,}/

const SCIM2_HEADERS: Record<string, string> = {
	Accept: 'application/json',
}
SCIM2_HEADERS['Content-Type'] = 'application/json'

const http = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false,
	}),
})
axiosLogger.axiosRequestLogger(http, logger)
axiosLogger.axiosResponseLogger(http, logger)

function renderProfile(
	req: express.Request,
	res: express.Response,
	props: Profile
) {
	return template.render('profile/view', req, res, props)
}

function renderSignIn(
	req: express.Request,
	res: express.Response,
	props: SignIn
) {
	return template.render('account/sign-in', req, res, props)
}

async function updateUserObject(
	req: express.Request,
	updatedProfile: WSO2Profile
) {
	const cshrUserObject = updatedProfile.CshrUser
	const newUser = model.User.create({
		...req.user,
		givenName: updatedProfile.name.givenName,
		...cshrUserObject,
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
	res.send(
		renderProfile(req, res, {
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
}

export interface Level {
	url: string
	name: string
}

export interface RegistryRole {
	name: string
	_links: {
		self: {href: string}
		jobRole: {href: string}
		parent: {href: string}
		children: {href: string}
		profession: {href: string}
	}
}

export interface RegistryProfession {
	name: string
	_links: {
		self: {href: string}
		jobRoles: {href: string}
	}
}

export interface LevelsinSession {
	currentRegistryUrl: string
	levels: Level[]
}

export interface RegistryRoles {
	_embedded: {
		jobRoles: RegistryRole[]
	}
}

export interface RegistryProfessions {
	_embedded: {
		professions: RegistryProfession[]
	}
}

export async function registryService(url: string) {
	const options = {
		baseURL: config.registryServiceURL,
	}
	try {
		const response = await http.get(url, options)
		return response.data
	} catch (e) {
		logger.error(e)
	}
}

function parseRegistryProfiles(registryProfessions: RegistryProfessions) {
	return registryProfessions._embedded.professions.map(profession => {
		return {
			name: profession.name,
			url: profession._links.jobRoles.href,
		}
	})
}

function parseRegistryRoles(registryRoles: RegistryRoles) {
	return registryRoles._embedded.jobRoles.map(jobRoles => {
		return {
			name: jobRoles.name,
			url: jobRoles._links.jobRole.href,
		}
	})
}

export async function newRenderAreasOfWorkPage(
	req: express.Request,
	res: express.Response
) {
	const lede = req.__('register_area_page_intro')
	let selectedArr = []
	let currentLevel
	let selected
	let levels: {
		name: string
		url: string
	}[][] = []

	if (req.query.select) {
		//update method goes here
		res.redirect('/profile')
	}

	if (req.params[0]) {
		selected = req.params[0]
		selectedArr = req.params[0].split('/')
		currentLevel = selectedArr.length
	}

	if (selectedArr.length === 0) {
		req.session!.levels = []
		levels = []
		//if there are no levels selected
		const traversonResult = await traverson
			.from('http://localhost:9002')
			.jsonHal()
			.follow('professions')
			.getResource().result
		try {
			const parsed = parseRegistryProfiles(traversonResult)
			levels.push(parsed)
			req.session!.levels = levels
		} catch (e) {
			logger.error(e)
		}
	} else {
		levels = req.session!.levels
		const followPath: string[] = []

		if (selectedArr) {
			selectedArr.forEach((selection: number, index: number) => {
				if (index === 0) {
					followPath.push(`professions[${selection}]`, 'jobRoles')
				} else {
					followPath.push(`jobRoles[${selection}]`, 'children')
				}
			})
		}

		const traversonResult = await traverson
			.from('http://localhost:9002')
			.jsonHal()
			.follow(followPath)
			.getResource().result
		try {
			const parsed = parseRegistryRoles(traversonResult)
			if (parsed.length === 0) {
				//end of the line
			}

			req.session!.levels[selectedArr.length] = parsed
		} catch (e) {
			logger.error(e)
		}
	}
	if (selectedArr) {
		req.session!.levels.slice(0, currentLevel)
		levels.slice(0, currentLevel)
	}

	res.send(
		template.render('profile/edit', req, res, {
			currentLevel,
			inputName: 'areas-of-work',
			lede,
			levels,
			...res.locals,
			selected,
			selectedArr,
		})
	)
}

export function renderAreasOfWorkPage(
	req: express.Request,
	res: express.Response
) {
	if (req.query.select) {
		// const selectedLevel = req.query.select
		//TODO: LPFG-49,241 - send request to profile service to update profile

		res.redirect('/profile')
	}
	const lede = req.__('register_area_page_intro')
	let selectedArr
	let currentLevel
	let selected
	if (req.params[0]) {
		selected = req.params[0]
		selectedArr = req.params[0].split('/')
		currentLevel = selectedArr.length
	}

	const levelsToShow: any[] = []

	res.send(
		template.render('profile/edit', req, res, {
			currentLevel,
			inputName: 'areas-of-work',
			lede,
			levels: levelsToShow,
			...res.locals,
			selected,
			selectedArr,
		})
	)
}

export function renderEditPage(req: express.Request, res: express.Response) {
	const inputName = req.params.profileDetail
	let options = {}
	let optionType: string = ''
	let value = null
	switch (inputName) {
		case 'given-name':
			value = req.user.givenName
			break
		case 'other-areas-of-work':
			options = req.__('areas-of-work')
			optionType = OptionTypes.Checkbox
			break
		case 'department':
			options = req.__('departments')
			optionType = OptionTypes.Typeahead
			value = req.user.department
			break
		case 'grade':
			options = req.__('grades')
			optionType = OptionTypes.Radio
			value = req.user.grade
			break
	}

	const script = `
	<script type="text/javascript" src="/js/accessible-autocomplete.min.js"></script>
	<script type="text/javascript">
		var selectEl = document.querySelector('.type-ahead')
		if (selectEl) {
			accessibleAutocomplete.enhanceSelectElement({
				autoselect: true,
				defaultValue: selectEl.options[selectEl.options.selectedIndex].innerHTML,
				minLength: 1,
				selectElement: selectEl,
			})
		}
    </script>`
	console.log(options)
	console.log(Object.entries(options))
	res.send(
		template.render('profile/edit', req, res, {
			...res.locals,
			inputName,
			optionType,
			options: Object.entries(options),
			script,
			value,
		})
	)
}

export function resetPassword(req: express.Request, res: express.Response) {
	res.send(template.render('account/reset-password', req, res))
}

export function signIn(req: express.Request, res: express.Response) {
	const sessionDataKey = req.query.sessionDataKey
	const loginFailed = req.query.authFailureMsg === 'login.fail.message'

	if (req.isAuthenticated()) {
		res.redirect('/')
	} else if (!sessionDataKey) {
		res.redirect('/authenticate')
	} else {
		res.send(
			renderSignIn(req, res, {
				authenticationServiceUrl: config.AUTHENTICATION.serviceUrl,
				loginFailed,
				sessionDataKey,
			})
		)
	}
}

export function signOut(req: express.Request, res: express.Response) {
	passport.logout(req, res)
}

export async function tryUpdateProfile(
	req: express.Request,
	res: express.Response
) {
	const validFields = validateForm(req)

	if (!validFields) {
		res.locals.validFields = validFields
		renderEditPage(req, res)
	} else {
		await updateProfile(req, res)
	}
}
export async function updateProfile(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const updateProfileObject: WSO2Profile = {
		CshrUser: {
			department: req.user.department,
			grade: req.user.grade,
			profession: (req.user.areasOfWork || []).join(','),
		},
		name: {givenName: req.user.givenName},
		userName: req.user.emailAddress,
	}

	const inputName = req.params.profileDetail
	const fieldValue = req.body[inputName]

	const options = {
		auth: {
			password: config.AUTHENTICATION.servicePassword,
			username: config.AUTHENTICATION.serviceAdmin,
		},
		baseURL: config.AUTHENTICATION.serviceUrl,
		headers: SCIM2_HEADERS,
	}

	switch (inputName) {
		case 'given-name':
			updateProfileObject.name.givenName = fieldValue
			break
		case 'email-address':
			updateProfileObject.userName = fieldValue
			break
		case 'department':
			updateProfileObject.CshrUser.department = fieldValue
			break
		case 'grade':
			updateProfileObject.CshrUser.grade = fieldValue
			break
		case 'other-areas-of-work':
			let joinedFieldValues
			if (Array.isArray(fieldValue)) {
				joinedFieldValues = fieldValue.join(',')
			} else {
				joinedFieldValues = fieldValue
			}
			if (joinedFieldValues) {
				updateProfileObject.CshrUser.profession = joinedFieldValues
			} else {
				delete updateProfileObject.CshrUser.profession
			}
			break
		case 'password':
			updateProfileObject.password = fieldValue
			let passwordFailed = ''

			if (fieldValue !== req.body.confirmPassword) {
				passwordFailed = 'Password does not match the confirmation.'
			} else if (fieldValue.length < 8) {
				passwordFailed = 'Password length should be at least 8 characters.'
			} else if (!validPassword.exec(fieldValue)) {
				passwordFailed = 'Password did not meet requirements'
			}

			if (passwordFailed) {
				res.send(
					template.render('profile/edit', req, res, {
						inputName,
						passwordFailed,
					})
				)
				return
			}

			break
	}

	try {
		const response = await http.put(
			`/scim2/Users/${req.user.id}`,
			updateProfileObject,
			options
		)
		await updateUserObject(req, JSON.parse(response.config.data))
		req.flash('profile-updated', 'profile-updated')
		req.session!.save(() => {
			res.redirect('/profile')
		})
	} catch (e) {
		res.send(
			template.render('profile/edit', req, res, {
				identityServerFailed: true,
				inputName,
			})
		)
	}
}
