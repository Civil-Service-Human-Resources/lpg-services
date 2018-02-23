import * as helper from 'extension/helper'
import * as puppeteer from 'puppeteer'
import {selectors, completeFeedback} from 'page/globals'
import {loginToCsl} from 'page/login'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import {wrappedBeforeAll, wrappedAfterAll} from 'extension/testsetup'
import * as config from 'test/config'

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

let TEST_USERNAME = genUserEmail()

describe('profile page functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('feedback')
		page = await session.newPage()
		await page.authenticate({
			username: config.BASIC_AUTH_USERNAME,
			password: config.BASIC_AUTH_PASSWORD,
		})
		await page.goto(config.URL)
		const userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'CO', 'HR', 'G7')
		await loginToCsl(page, config.USERNAME, config.PASSWORD)
		await page.waitFor(selectors.signoutButton)
	})

	wrappedAfterAll(async () => {
		const userInfo = await getUser(TEST_USERNAME)
		await deleteUser(userInfo.id)
		await page.close()
	})

	it('Should display the feedback link on the home page', async () => {
		await page.waitForSelector(selectors.feedbackPrompt)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackPrompt, page)
		).toBe(true)
	})

	it('Should display two text fields and a send button when feedback link is clicked', async () => {
		await page.click(selectors.feedbackPrompt)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackDoingField, page)
		).toBe(true)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackWrongField, page)
		).toBe(true)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackSubmitButton, page)
		).toBe(true)
	})

	it('Should hide hide two text fields and a send button when feedback link is clicked', async () => {
		await page.click(selectors.feedbackPrompt)
		//expect()
	})

	it('Should send feedback when the information is entered and submitted', async () => {
		await page.click(selectors.feedbackPrompt)
		await completeFeedback(page)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackDetails, page)
		).toBe(true)
	})

	it('Should display the feedback link on the profile page', async () => {
		await page.goto(config.BASE_URL + '/profile')
		await page.waitForSelector(selectors.feedbackPrompt)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackPrompt, page)
		).toBe(true)
	})

	it('Should display the feedback link on the learner record page', async () => {
		await page.goto(config.BASE_URL + '/learning-record')
		await page.waitForSelector(selectors.feedbackPrompt)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackPrompt, page)
		).toBe(true)
	})

	it('Should display feedback link on suggested for you page', async () => {
		await page.goto(config.BASE_URL + '/suggested-for-you')
		await page.waitForSelector(selectors.feedbackPrompt)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackPrompt, page)
		).toBe(true)
	})

	it('Should display feedback link on the course overview page', async () => {
		await page.goto(config.BASE_URL + '/home')
		await page.click('.learning__title')
		await page.waitForSelector(selectors.feedbackPrompt)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackPrompt, page)
		).toBe(true)
	})

	it('Should display feedback link on the sign-in page', async () => {
		await page.goto(config.BASE_URL + '/sign-out')
		await page.waitForSelector(selectors.feedbackPrompt)
		expect(
			await helper.checkElementIsPresent(selectors.feedbackPrompt, page)
		).toBe(true)
	})
})
