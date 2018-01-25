import * as helper from 'extension/helper'
import {selectors} from 'page/profile'
import * as puppeteer from 'puppeteer'

declare var browser: puppeteer.Browser

const timeout = 5000
const {URL = ''} = process.env

describe('profile page functionality', () => {
	let page: puppeteer.Page

	beforeAll(async () => {
		page = await browser.newPage()
		await page.goto(URL)
		await page.click(selectors.profilePageButton)
	}, timeout)

	afterAll(async () => {
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
})
