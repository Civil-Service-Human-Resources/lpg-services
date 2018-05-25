import axios from 'axios'
import * as express from 'express'
import * as https from 'https'
import * as log4js from 'log4js'

import * as axiosLogger from 'lib/axiosLogger'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as registry from 'lib/registry'
import * as template from 'lib/ui/template'

import * as config from 'lib/config'
import * as passport from 'lib/config/passport'

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
	'department' = 'organisation',
	'grade' = 'grade',
	'primary-area-of-work' = 'profession',
	'other-areas-of-work' = 'otherAreasOfWork',
	'password' = 'password',
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
	updatedProfile: Record<string, string>
) {
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

export function parseProfessions(
	traversonResult: any
): [Level[], string] | void {
	try {
		const parsed = traversonResult._embedded.professions.map(
			(profession: any) => {
				return {
					name: profession.name,
					url: profession._links.jobRoles.href,
				}
			}
		)
		return [parsed, traversonResult._links.self.href]
	} catch (e) {
		logger.error(e)
		return
	}
}

export function parseRoles(traversonResult: any): [Level[], string] | void {
	try {
		const parsed = traversonResult._embedded.jobRoles.map((role: any) => {
			return {
				hasChildren: role.hasChildren,
				name: role.name,
				url: role._links.self.href,
			}
		})

		return [parsed, traversonResult._links.self.href]
	} catch (e) {
		logger.error(e)
		return
	}
}

export async function newRenderAreasOfWorkPage(
	req: express.Request,
	res: express.Response
) {
	const lede = req.__('register_area_page_intro')
	let selectedArr = []
	let currentLevel: number = 0
	let selected: number
	let levels: Level[][] = []
	let prevLevelUrl

	if (req.query.select) {
		const arrUpdate = req.query.select.split('/')
		await patchAndUpdate(
			arrUpdate[0],
			req.query.select,
			'areas-of-work',
			req,
			res
		)
		return
	}

	if (req.params[0]) {
		/* set the 'progress' vars */
		selectedArr = req.params[0].split('/')
		currentLevel = selectedArr.length
		selected = selectedArr[currentLevel - 1] || 0
	}

	if (currentLevel === 0) {
		/* if the user hasn't selected anything, start from the beginning and reset 'levels' vars */
		req.session!.levels = []
		levels = []

		const parsed = parseProfessions(await registry.get('professions'))

		if (parsed) {
			levels.push(parsed[0])
			req.session!.prevLevelUrl = parsed[1]
		}
	} else {
		/* if the user has selected levels or there are req.params[0] */
		levels = req.session!.levels
		const followPath: string[] = []

		prevLevelUrl = levels[currentLevel! - 1][selected!].url
		if (levels.length === currentLevel) {
			if (selectedArr.length! > 1) {
				followPath.push('children')
			}
		} else {
			/* If they don't match up, start from the beginning and reconstruct the path.
			 * This may happen when they use the url to navigate to a level
			 * or go backwards
			 */

			prevLevelUrl = levels[currentLevel - 1][selected!].url

			selectedArr.forEach((selection: number, index: number) => {
				if (index > 0) {
					followPath.push('children')
				}
			})
		}

		const traversonResult = await registry.follow(prevLevelUrl, followPath)

		if (levels.length === 0) {
			/* if there are no levels saved, use parseProfessions method since the response contains 'professions' key */
			const parsed = parseProfessions(traversonResult)
			if (parsed) {
				levels.push(parsed[0])
				req.session!.prevLevelUrl = parsed[1]
			}
		} else {
			/* if there are levels saved, use parseRoles method since the response contains 'jobRoles' key */
			const parsed = parseRoles(traversonResult)

			if (parsed) {
				/* only set the results to the appropriate level*/
				levels[selectedArr.length] = parsed[0]
				req.session!.prevLevelUrl = parsed[1]
			}
		}
	}

	if (selectedArr) {
		/* Slice the array to the amount of levels the user should see and save the levels to session */
		levels = levels.slice(0, selectedArr.length + 1)
		req.session!.levels = levels
	}

	res.send(
		template.render('profile/edit', req, res, {
			currentLevel,
			inputName: 'areas-of-work',
			lede,
			levels,
			...res.locals,
			selected: selected!,
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

export async function renderEditPage(
	req: express.Request,
	res: express.Response
) {
	const inputName = req.params.profileDetail
	let options: {[prop: string]: any} = {}
	let optionType: string = ''
	let value = null
	let lede
	switch (inputName) {
		case 'given-name':
			value = req.user.givenName
			break
		case 'primary-area-of-work':
			lede = req.__('register_area_page_intro')
			options = haltoObject(await registry.halNode('professions'))
			optionType = OptionTypes.Radio
			break
		case 'other-areas-of-work':
			options = haltoObject(await registry.halNode('professions'))
			if (req.user.areasOfWork) {
				const profession: string = Object.values(
					req.user.areasOfWork
				)[0].toString()
				const indexOfProfession: number = Object.values(options).indexOf(
					profession
				)
				delete options[Object.keys(options)[indexOfProfession]]
			}

			optionType = OptionTypes.Checkbox
			break
		case 'department':
			options = haltoObject(await registry.halNode('organisations'))
			optionType = OptionTypes.Typeahead
			value = req.user.department
			break
		case 'grade':
			options = haltoObject(await registry.halNode('grades'))
			optionType = OptionTypes.Radio
			value = req.user.grade
			break
		case 'name':
			value = req.user.name
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
	res.send(
		template.render('profile/edit', req, res, {
			...res.locals,
			inputName,
			lede,
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
	passport.logout(
		config.AUTHENTICATION.serviceUrl,
		config.LPG_UI_SERVER,
		req,
		res
	)
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

export async function patchAndUpdate(
	node: string,
	value: string,
	input: string,
	req: express.Request,
	res: express.Response
) {
	const call: Record<string, string> = {}
	call[node] = value
	const response = await registry.patch(
		'civilServants',
		call,
		req.user.accessToken
	)

	if (response) {
		// seems like we have to get the profile again to get values
		// which seems ...not good
		const profile = await registry.profile(req.user.accessToken)
		await updateUserObject(req, profile as Record<string, string>)
		req.flash('profile-updated', 'profile-updated')
		req.session!.save(() => {
			res.redirect('/profile')
		})
	} else {
		res.send(
			template.render('profile/edit', req, res, {
				identityServerFailed: true,
				input,
			})
		)
	}
}

export async function updateProfile(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest

	let inputName = req.params.profileDetail
	let fieldValue = req.body[inputName]

	const node = nodes[inputName]

	switch (node) {
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
		case 'password':
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

	if (node in ['password']) {
		// do something with identity
	} else {
		await patchAndUpdate(node, fieldValue, inputName, req, res)
	}
}
