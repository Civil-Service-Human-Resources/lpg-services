import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {loginToCsl, selectors} from 'page/login'
import * as puppeteer from 'puppeteer'
declare var browser: puppeteer.Browser

describe('login page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		page = await browser.newPage()
		// await page.authenticate({
		// 	password: config.BASIC_AUTH_PASSWORD,
		// 	username: config.BASIC_AUTH_USERNAME,
		// })
		await page.goto(config.URL)
	})

	wrappedAfterAll(async () => {
		await page.close()
	})

	it('Should login to the CSL portal', async () => {
		//await page.waitForSelector('a[href="sign-in"]')
		await loginToCsl(page, config.USERNAME, config.PASSWORD)
		await page.waitFor(selectors.signoutButton)
		expect(
			await helper.checkElementIsPresent(selectors.signoutButton, page)
		).toBe(true)
	})
})
