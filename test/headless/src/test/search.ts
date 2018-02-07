import * as helper from 'extension/helper'
import { selectors } from 'page/search'
import * as puppeteer from 'puppeteer'

declare var browser: puppeteer.Browser

const timeout = 5000
const { URL = '' } = process.env

describe('profile page functionality', () => {
	let page: puppeteer.Page

	beforeAll(async () => {
		page = await browser.newPage()
		await page.goto(URL)
		await page.click(selectors.searchPageButton)
	}, timeout)

	afterAll(async () => {
		await page.close()
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
})
