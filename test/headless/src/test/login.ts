import * as helper from 'extension/helper'
import {loginToCsl, selectors} from 'page/login'
import * as puppeteer from 'puppeteer'

declare var browser: puppeteer.Browser
const timeout = 5000
const {URL = '', USERNAME = '', PASS = ''} = process.env

describe('login page elements', () => {
	let page: puppeteer.Page

	beforeAll(async () => {
		page = await browser.newPage()
		await page.goto(URL)
	}, timeout)

	afterAll(async () => {
		await page.close()
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

	it('Should display accont recovery steps when login fails', async () => {
		await loginToCsl(page, 'username@test.com', 'failed')
		await page.waitFor(selectors.loginFailure, {timeout: 5000})
		expect(
			await helper.checkElementIsPresent(selectors.loginFailure, page)
		).toBe(true)
	})

	it('Should login to the CSL portal', async () => {
		await loginToCsl(page, USERNAME, PASS)
		await page.waitFor(selectors.loginSucess, {timeout: 9000})
		expect(
			await helper.returnElementValue(selectors.loginSucess, page)
		).toContain(USERNAME)
	})
})
