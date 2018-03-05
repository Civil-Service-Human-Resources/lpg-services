import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {createUser, deleteUser, getUser} from 'extension/user'
import {loginToCsl} from 'page/login'
import {
	returnUserProfileDetails,
	selectors,
	setProfileFieldToEmptyAndSave,
	setUserProfileDetails,
} from 'page/profile'
import * as puppeteer from 'puppeteer'

const timeout = 10000

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

const TEST_USERNAME = genUserEmail()

describe('profile page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('profile')
		page = await session.newPage()
		await page.authenticate({
			password: config.BASIC_AUTH_PASSWORD,
			username: config.BASIC_AUTH_USERNAME,
		})
		await page.goto(config.URL)
		await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await loginToCsl(page, TEST_USERNAME, config.TEST_PASSWORD)
		await page.waitFor(selectors.signoutButton, {timeout: 10000})
		await page.goto(config.BASE_URL + '/profile')
	})

	wrappedAfterAll(async () => {
		const userInfo = await getUser(TEST_USERNAME)
		await deleteUser(userInfo.id)
		await page.close()
	})

	it('Should display a feedback link with the correct email address', async () => {
		const feedbackUrl = await helper.returnElementAttribute(
			selectors.feedbackLink,
			'href',
			page
		)
		expect(feedbackUrl).toEqual('mailto:feedback@cslearning.gov.uk')
	})

	it('Should display username field which matches email address', async () => {
		const username = await helper.returnElementAttribute(
			selectors.userName,
			'value',
			page
		)
		expect(username).toEqual(TEST_USERNAME)
	})

	it('Should display the first name field', async () => {
		expect(await helper.checkElementIsPresent(selectors.firstName, page)).toBe(
			true
		)
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

	it('Should display an error message for missing firstname entry', async () => {
		await setProfileFieldToEmptyAndSave(selectors.firstName, page)
		await page.waitFor(selectors.firstNameFieldError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.firstNameFieldError, page)
		).toBe(true)
	})

	it('Should display an error message for missing department field entry', async () => {
		await setProfileFieldToEmptyAndSave(selectors.department, page)
		await page.waitFor(selectors.departmentFieldError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.departmentFieldError, page)
		).toBe(true)
	})

	it('Should display an error message for missing professions field entry', async () => {
		await setProfileFieldToEmptyAndSave(selectors.profession, page)
		await page.waitFor(selectors.professionFieldError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.professionFieldError, page)
		).toBe(true)
	})

	it('Should display an error message for missing grade field entry', async () => {
		await setProfileFieldToEmptyAndSave(selectors.grade, page)
		await page.waitFor(selectors.gradeFieldError, timeout)
		expect(
			await helper.checkElementIsPresent(selectors.gradeFieldError, page)
		).toBe(true)
	})

	it('Should save profile details to the user account and display profile updated page', async () => {
		await setUserProfileDetails(page)
		expect(
			await helper.checkElementIsPresent(selectors.profileUpdatedMessage, page)
		).toBe(true)
	})
})
