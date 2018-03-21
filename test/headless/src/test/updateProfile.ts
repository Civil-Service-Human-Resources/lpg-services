import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {loginToCsl} from 'page/login'
import {editProfileInfo, selectors} from 'page/profile'
import * as puppeteer from 'puppeteer'

describe('profile page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('update profile')
		page = await session.newPage()
		await page.authenticate({
			password: config.BASIC_AUTH_PASSWORD,
			username: config.BASIC_AUTH_USERNAME,
		})
		await page.goto(config.URL)
		await loginToCsl(page, 'test@lpg.dev.cshr.digital', '1337h4x0r')
		await page.waitFor(selectors.signoutButton, {timeout: 10000})
		await page.goto(config.BASE_URL + '/profile')
	})

	wrappedAfterAll(async () => {
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
		const username = await helper.getText(selectors.emailAddress, page)
		expect(username).toEqual('test@lpg.dev.cshr.digital')
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
			selectors.updateGivenName,
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
		const dept = 'Home Office'
		await editProfileInfo(
			selectors.updateDepartment,
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
})
