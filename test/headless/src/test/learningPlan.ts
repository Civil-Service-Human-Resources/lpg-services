import * as helper from 'extension/helper'
import {selectors} from 'page/learningPlan'
import {loginToCsl} from 'page/login'
import * as puppeteer from 'puppeteer'
import {wrappedBeforeAll, wrappedAfterAll} from 'extension/testsetup'

const {
	URL = '',
	USERNAME = '',
	PASS = '',
	DIALOG_USERNAME = '',
	DIALOG_PASSWORD = '',
} = process.env

describe('profile page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('learning plan')
		page = await session.newPage()
		await page.authenticate({
			username: DIALOG_USERNAME,
			password: DIALOG_PASSWORD,
		})
		await page.goto(URL)
		await loginToCsl(page, USERNAME, PASS)
		await page.waitFor(selectors.signoutButton)
	})

	wrappedAfterAll(async () => {
		await page.close()
	})

	it('Should display the required learning section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.requiredLearingSection, page)
		).toBe(true)
	})

	it('Should display the learning plan section', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.learningPlanSection, page)
		).toBe(true)
	})
})
