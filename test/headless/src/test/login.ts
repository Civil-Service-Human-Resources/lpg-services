import * as helper from 'extension/helper'
import {loginToCsl, selectors} from 'page/login'
import * as puppeteer from 'puppeteer'

declare var browser: puppeteer.Browser

const timeout = 5000
const {URL = '', USERNAME = '', PASS = ''} = process.env
const contactUsEmailAddress = 'mailto:feedback@cslearning.gov.uk'

describe('login page functionality', () => {
	let page: puppeteer.Page

	beforeAll(async () => {
		// const session = await helper.getSession('login')
		// page = await session.newPage()
		page = await browser.newPage()
		await page.goto(URL)
	}, timeout)

	afterAll(async () => {
		await page.close()
	})

	it('Should display the sign-in link with correct url', async () => {
		const signinLink = await helper.returnElementAttribute(
			selectors.signinButton,
			'href',
			page
		)
		expect(
			await helper.checkElementIsPresent(selectors.signinButton, page)
		).toBe(true)
		expect(signinLink).toEqual('/sign-in')
	})

	it('Should load the username field', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.usernameField, page)
		).toBe(true)
	})

	it('Should load the password field', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.passwordField, page)
		).toBe(true)
	})

	it('Should load the login button', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.loginButton, page)
		).toBe(true)
	})

	it('Should display a feedback link with the correct email address', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.feedbackLink, page)
		).toBe(true)
		const feedbackUrl = await helper.returnElementAttribute(
			selectors.feedbackLink,
			'href',
			page
		)
		expect(feedbackUrl).toEqual(contactUsEmailAddress)
	})

	it('Should diplay a link to the user allowing them to get in touch to create account', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.getInTouchLink, page)
		).toBe(true)
		const contactUsLink = await helper.returnElementAttribute(
			selectors.getInTouchLink,
			'href',
			page
		)
		expect(contactUsLink).toEqual(contactUsEmailAddress)
	})

	it('Should display login failure message when credentials are incorrect', async () => {
		await loginToCsl(page, 'username@test.com', 'failed')
		await page.waitFor(selectors.loginFailure, {timeout: 5000})
		expect(
			await helper.checkElementIsPresent(selectors.loginFailure, page)
		).toBe(true)
	})

	it('Should login to the CSL portal', async () => {
		await loginToCsl(page, USERNAME, PASS)
		await page.waitFor(selectors.profilePageButton, timeout)
		await page.click(selectors.profilePageButton)
		await page.waitFor(selectors.loginSucess, {timeout: 5000})
		const loggedInUser = await helper.returnElementAttribute(
			selectors.loginSucess,
			'value',
			page
		)
		expect(loggedInUser).toEqual(USERNAME)
	})
})
