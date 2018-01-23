import * as helper from 'extension/helper'
import {selectors} from 'page/profile'
import {loginToCsl} from 'page/login'
import * as puppeteer from 'puppeteer'

declare var browser: puppeteer.Browser
const timeout = 5000
const {URL = '', USERNAME = '', PASS = ''} = process.env

describe('profile page functionality', () => {
	let page: puppeteer.Page

	beforeAll(async () => {
		page = await browser.newPage()
		await page.goto(URL)
	}, timeout)

	afterAll(async () => {
		await page.close()
	})

	it('Should display a feedback link with the correct email address', async () => {
		//Implement correctly once logout in working
		const feedbackUrl = await helper.returnElementAttribute(
			selectors.feedbackLink,
			'href',
			page
		)
		expect(feedbackUrl).toEqual('mailto:feedback@cslearning.gov.uk')
	})
})
