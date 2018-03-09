import axios from 'axios'
import * as express from 'express'
import * as https from 'https'
import * as config from 'lib/config'
import * as passport from 'lib/config/passport'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'

export interface Profile {
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

const SCIM2_HEADERS: Record<string, string> = {
	Accept: 'application/json',
}
SCIM2_HEADERS['Content-Type'] = 'application/json'

export enum ProfileDetail {
	givenName = 'profile_name_label',
	emailAddress = 'profile_email_label',
	password = 'profile_password_label',
	department = 'profile_department_label',
	profession = 'profile_area_label',
	grade = 'profile_grade_label',
}

const http = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false,
	}),
})

function renderProfile(req: express.Request, props: Profile) {
	return template.render('profile/view', req, props)
}

function renderSignIn(req: express.Request, props: SignIn) {
	return template.render('account/sign-in', req, props)
}

async function updateUserObject(
	req: express.Request,
	updatedProfile: WSO2Profile
) {
	const cshrUserObject = updatedProfile.CshrUser
	const newUser = {
		...req.user,
		givenName: updatedProfile.name.givenName,
		...cshrUserObject,
	}
	await new Promise(resolve => {
		req.login(newUser, resolve)
	})
}

function validateForm(req: express.Request) {
	const form = req.body
	let validFields = true
	for (const input of Object.keys(form)) {
		if (!/\S/.test(form[input])) {
			form[input] = ''
			validFields = false
		}
	}
	return validFields
}
export function viewProfile(req: express.Request, res: express.Response) {
	res.send(
		renderProfile(req, {
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

export function renderEditPage(req: express.Request, res: express.Response) {
	const inputName = req.params.profileDetail
	const label = ProfileDetail[inputName]
	let options = {}
	let optionType: string = ''
	let lede: string = ''
	switch (inputName) {
		case 'department':
			options = req.__('departments')
			optionType = OptionTypes.Typeahead
			break
		case 'profession':
			options = req.__('areas-of-work')
			optionType = OptionTypes.Checkbox
			lede = req.__('register_area_page_intro')
			break
		case 'grade':
			options = req.__('grades')
			optionType = OptionTypes.Radio
	}

	const script = `
	<script type="text/javascript" src="/js/accessible-autocomplete.min.js"></script>
	<script type="text/javascript">
		var selectEl = document.querySelector('.type-ahead')
		accessibleAutocomplete.enhanceSelectElement({
			autoselect: true,
			defaultValue: selectEl.options[selectEl.options.selectedIndex].innerHTML,
			minLength: 1,
			selectElement: selectEl,
		})
    </script>`
	res.send(
		template.render('profile/profileEditPage', req, {
			inputName,
			label,
			lede,
			optionType,
			options: Object.entries(options),
			script,
		})
	)
}

export function editProfileComplete(
	req: express.Request,
	res: express.Response
) {
	res.send(template.render('profile/edit-success', req))
}

export function resetPassword(req: express.Request, res: express.Response) {
	res.send(template.render('account/reset-password', req))
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
			renderSignIn(req, {
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

export function tryUpdateProfile(req: express.Request, res: express.Response) {
	const validFields = validateForm(req)

	if (!validFields) {
		const inputName = req.params.profileDetail
		const label = ProfileDetail[inputName]
		res.send(
			template.render('profile/profileEditPage', req, {
				inputName,
				label,
				validFields,
			})
		)
	} else {
		updateProfile(req, res)
	}
}
export async function updateProfile(
	req: express.Request,
	res: express.Response
) {
	const updateProfileObject: WSO2Profile = {
		CshrUser: {
			department: req.user.department,
			grade: req.user.grade,
			profession: req.user.profession,
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
		case 'givenName':
			updateProfileObject.name.givenName = fieldValue
			break
		case 'emailAddress':
			updateProfileObject.userName = fieldValue
			break
		case 'department':
			updateProfileObject.CshrUser.department = fieldValue
			break
		case 'grade':
			updateProfileObject.CshrUser.grade = fieldValue
			break
		case 'profession':
			let joinedFieldValues = ''

			if (Array.isArray(fieldValue)) {
				joinedFieldValues = fieldValue.join()
			} else if (fieldValue) {
				joinedFieldValues = fieldValue
			} else {
				joinedFieldValues = 'Other'
			}
			updateProfileObject.CshrUser.profession = joinedFieldValues
			break
		case 'password':
			updateProfileObject.password = fieldValue

			if (fieldValue !== req.body.confirmPassword) {
				res.send(
					template.render('profile/profileEditPage', req, {
						inputName,
						label: ProfileDetail[inputName],
						passwordConfirmedFailed: true,
					})
				)
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
		res.redirect('/profile-updated')
	} catch (e) {
		res.send(
			template.render('profile/profileEditPage', req, {
				identityServerFailed: true,
				inputName,
				label: ProfileDetail[inputName],
			})
		)
	}
}
