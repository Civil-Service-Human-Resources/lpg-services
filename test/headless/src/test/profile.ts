import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {
	createUser,
	deleteUser,
	getUser,
	updateUser,
	updateUserGroups,
} from 'extension/user'
import {loginToCsl} from 'page/login'
import {arrMod, editAreaOfWork, editProfileInfo, selectors} from 'page/profile'
import * as puppeteer from 'puppeteer'

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

const TEST_USERNAME = genUserEmail()
const smartSurveyLink = 'https://www.smartsurvey.co.uk/s/QNJEE/'

describe('profile page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('profile')
		page = await session.newPage()
		if (config.PROFILE !== 'local') {
			await page.authenticate({
				password: config.BASIC_AUTH_PASSWORD,
				username: config.BASIC_AUTH_USERNAME,
			})
		}
		await page.goto(config.URL)
		const userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G6')
		await updateUserGroups(TEST_USERNAME, userId)
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
		expect(feedbackUrl).toEqual(smartSurveyLink)
	})

	it('Should display username field which matches email address', async () => {
		const username = await helper.getText(selectors.emailAddress, page)
		expect(username).toEqual(TEST_USERNAME)
	})

	it('Should display the first name field', async () => {
		expect(await helper.checkElementIsPresent(selectors.givenName, page)).toBe(
			true
		)
	})

	it('Should display the department field', async () => {
		expect(await helper.checkElementIsPresent(selectors.department, page)).toBe(
			true
		)
	})

	it('Should display the profession field', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.areasOfWork, page)
		).toBe(true)
	})

	it('Should display the grade field', async () => {
		expect(await helper.checkElementIsPresent(selectors.grade, page)).toBe(true)
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

	it('Should display the username field as readonly', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.emailAddressReadOnly, page)
		).toBe(true)
	})

	it('Should be able to update users name from the profile section', async () => {
		const name = 'John'
		await editProfileInfo(
			selectors.changeGivenName,
			selectors.editNameField,
			name,
			page
		)
		expect(
			await helper.checkElementIsPresent(selectors.profileUpdatedBanner, page)
		).toBe(true)
		const updatedName = await helper.getText(selectors.givenName, page)
		expect(updatedName).toEqual(name)
	})

	it('Should be able to update users department from the profile page', async () => {
		const dept = 'HM Revenue & Customs'
		await editProfileInfo(
			selectors.changeDepartment,
			selectors.editDepartmentField,
			dept,
			page
		)
		expect(
			await helper.checkElementIsPresent(selectors.profileUpdatedBanner, page)
		).toBe(true)
		const updatedDept = await helper.getText(selectors.department, page)
		expect(updatedDept).toEqual(dept)
	})

	it('Should display users profession as commercial', async () => {
		const current = await helper.getText(selectors.currentAreaOfWork, page)
		expect(current).toEqual('Commercial')
	})

	it('Should change the users profession value', async () => {
		await editAreaOfWork(
			selectors.commercialAreaOfWork,
			arrMod(['Digital']),
			page
		)
		await page.waitForSelector(selectors.profileUpdatedBanner)
		const current = await helper.getText(selectors.currentAreaOfWork, page)
		expect(current).toEqual('Digital')
	})

	it('Should update the users grade from the profile page', async () => {
		const map = new Map()
		map.set('#AA', 'Administrative level')
		map.set('#EO', 'First line manager')
		map.set('#HEO', 'Middle manager')
		map.set('#G6', 'Senior manager')
		map.set('#SCS', 'Director')
		map.set('#other', 'Other')
		for (const [code, gradeName] of map.entries()) {
			await page.click(selectors.changeGrade)
			await page.waitForSelector(code)
			await page.click(code)
			await page.click(selectors.continueButton)
			await page.waitForSelector(selectors.profileUpdatedBanner)
			const profilegrade = await helper.getText(selectors.grade, page)
			expect(profilegrade).toEqual(gradeName)
		}
	})
})
