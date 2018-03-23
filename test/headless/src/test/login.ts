import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {loginToCsl, selectors} from 'page/login'
import * as puppeteer from 'puppeteer'

const smartSurveyLink = 'https://www.smartsurvey.co.uk/s/QNJEE/'
const contactUsEmailAddress = 'mailto:feedback@cslearning.gov.uk'

describe('login page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('login')
		page = await session.newPage()
		await page.authenticate({
			password: config.BASIC_AUTH_PASSWORD,
			username: config.BASIC_AUTH_USERNAME,
		})
		await page.goto(config.URL)
	})

	wrappedAfterAll(async () => {
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

	it('Should display a feedback link with the correct survey link', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.feedbackLink, page)
		).toBe(true)
		const feedbackUrl = await helper.returnElementAttribute(
			selectors.feedbackLink,
			'href',
			page
		)
		expect(feedbackUrl).toEqual(smartSurveyLink)
	})

	it('Should display a link to the user allowing them to get in touch to create account', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.getInTouchLink, page)
		).toBe(true)
		await page.waitForSelector(selectors.getInTouchLink)
		const contactUsLink = await helper.returnElementAttribute(
			selectors.getInTouchLink,
			'href',
			page
		)
		expect(contactUsLink).toEqual(contactUsEmailAddress)
	})

	it('Should display login failure message when credentials are incorrect', async () => {
		await loginToCsl(page, 'username@test.com', 'failed')
		await page.waitForSelector(selectors.loginFailure)
		expect(
			await helper.checkElementIsPresent(selectors.loginFailure, page)
		).toBe(true)
	})

	it('Should login to the CSL portal', async () => {
		await loginToCsl(page, config.USERNAME, config.PASSWORD)
		await page.waitFor(selectors.signoutButton)
		expect(
			await helper.checkElementIsPresent(selectors.signoutButton, page)
		).toBe(true)
	})
})
