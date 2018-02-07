import * as helper from 'extension/helper'
import {
	selectors,
	returnUserProfileDetails,
	setProfileFieldToEmptyAndSave,
<<<<<<< Updated upstream
} from 'page/profile'
import {loginToCsl} from 'page/login'
=======
	setUserProfileDetails,
} from 'page/profile'
import { loginToCsl } from 'page/login'
import { createUser, getUser, deleteUser } from 'extension/user'
>>>>>>> Stashed changes
import * as puppeteer from 'puppeteer'
import {getUser} from '../extension/user'
//import {createUser} from '../../../../service/ui/src/controllers/user'

declare var browser: puppeteer.Browser

const timeout = 5000
<<<<<<< Updated upstream
const {URL = '', USERNAME = '', PASS = ''} = process.env
=======
const { URL = '', TEST_USERNAME = '', TEST_PASSWORD = '' } = process.env
>>>>>>> Stashed changes

describe('profile page functionality', () => {
	let page: puppeteer.Page

	beforeAll(async () => {
		page = await browser.newPage()
		await page.goto(URL)
<<<<<<< Updated upstream
		const userId = (await getUser(USERNAME)).id
		console.log('USERNAME ID >>>>>>>>>>>>>>>>>>.', userId)
		await loginToCsl(page, USERNAME, PASS)
=======
		await createUser(TEST_USERNAME, TEST_PASSWORD)
		await loginToCsl(page, TEST_USERNAME, TEST_PASSWORD)
>>>>>>> Stashed changes
		await page.waitFor(selectors.profilePageButton, timeout)
	}, timeout)

	afterAll(async () => {
<<<<<<< Updated upstream
		await page.click(selectors.signoutButton)
		await page.waitFor('#password', timeout)
=======
		const userInfo = (await getUser(TEST_USERNAME))
		await page.click(selectors.signoutButton)
		await page.waitFor('#password', timeout)
		await (deleteUser(userInfo.id))
>>>>>>> Stashed changes
		await page.close()
	})

	it('Should display a feedback link with the correct email address', async () => {
		// TODO(will): Implement correctly once logout in working
		const feedbackUrl = await helper.returnElementAttribute(
			selectors.feedbackLink,
			'href',
			page
		)
		expect(feedbackUrl).toEqual('mailto:feedback@cslearning.gov.uk')
	})

	it('Should display the department field', async () => {
		expect(await helper.checkElementIsPresent(selectors.department, page)).toBe(
			true
		)
	})

	it('Should display the profession field', async () => {
		expect(await helper.checkElementIsPresent(selectors.profession, page)).toBe(
			true
		)
	})

	it('Should display the grade field', async () => {
		expect(await helper.checkElementIsPresent(selectors.grade, page)).toBe(true)
	})

	it('Should display the save profile changes button', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.saveProfileButton, page)
		).toBe(true)
	})

	it('Should display a sign-out button with correct url', async () => {
		const signoutLink = await helper.returnElementAttribute(
			selectors.signoutButton,
			'href',
			page
		)
		expect(
			await helper.checkElementIsPresent(selectors.signoutButton, page)
		).toBe(true)
		expect(signoutLink).toEqual('/sign-out')
	})

	it('Should display empty profession, department and grade fields on first login', async () => {
		const profile = await returnUserProfileDetails(page)
		expect(profile.userName).toBeTruthy()
		for (const prop of ['department', 'profession', 'grade']) {
			expect(profile[prop]).toBe('')
		}
	})

	it('Should display an error message to the user if profile is incomplete', async () => {
		await page.waitFor(selectors.incompleteProfileError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.incompleteProfileError, page)
		).toBe(true)
	})

	it('Should display the username field as readonly', async () => {
		expect(
			await helper.returnElementAttribute(selectors.userName, 'readonly', page)
		).toBeTruthy()
	})

	it('Should display an error message for missing department field entry', async () => {
		await setProfileFieldToEmptyAndSave(selectors.department, page)
		await page.waitFor(selectors.departmentFieldError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.departmentFieldError, page)
		).toBe(true)
	})

	it('Should display an error message for missing department field entry', async () => {
		await setProfileFieldToEmptyAndSave(selectors.profession, page)
		await page.waitFor(selectors.professionFieldError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.professionFieldError, page)
		).toBe(true)
	})

	it('Should display an error message for missing department field entry', async () => {
		await setProfileFieldToEmptyAndSave(selectors.grade, page)
		await page.waitFor(selectors.gradeFieldError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.gradeFieldError, page)
		).toBe(true)
	})

<<<<<<< Updated upstream
	it('')
=======
	it('Should save profile details to the user account and display profile updated page', async () => {
		await setUserProfileDetails(page)
		expect(
			await helper.checkElementIsPresent(selectors.profileUpdatedMessage, page)
		).toBe(true)
		await page.click(selectors.profilePageButton)
		await page.waitFor(selectors.grade)
		const profile = await returnUserProfileDetails(page)
		expect(profile.profession).toEqual('profession')
		expect(profile.grade).toEqual('grade')
		expect(profile.department).toEqual('department')
	})
>>>>>>> Stashed changes
})


