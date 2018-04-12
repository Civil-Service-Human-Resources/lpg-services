import axios from 'axios'
import * as axiosLogger from 'lib/axiosLogger'
import * as express from 'express'
import * as https from 'https'
import * as config from 'lib/config'
import * as passport from 'lib/config/passport'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'

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

export function renderEditPage(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const inputName = req.params.profileDetail
	let options = {}
	let optionType: string = ''
	let value = null
	let lede: string = ''
	switch (inputName) {
		case 'given-name':
			value = req.user.givenName
			break
		case 'department':
			options = req.__('departments')
			optionType = OptionTypes.Typeahead
			value = req.user.department
			break
		case 'areas-of-work':
			options = req.__('areas-of-work')
			optionType = OptionTypes.Checkbox
			lede = req.__('register_area_page_intro')
			value = req.user.areasOfWork
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
		case 'areas-of-work':
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
