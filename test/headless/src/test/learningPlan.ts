import * as helper from 'extension/helper'
import * as puppeteer from 'puppeteer'
import {selectors} from 'page/learningPlan'
import {loginToCsl} from 'page/login'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import {wrappedBeforeAll, wrappedAfterAll} from 'extension/testsetup'

const {
	URL = '',
	USERNAME = '',
	PASS = '',
	TEST_PASSWORD = '',
	DIALOG_USERNAME = '',
	DIALOG_PASSWORD = '',
} = process.env

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

let TEST_USERNAME = genUserEmail()

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
		const userId = await createUser(TEST_USERNAME, TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'CO', 'HR', 'G7')
		await loginToCsl(page, USERNAME, PASS)
		await page.waitFor(selectors.signoutButton)
	})

	wrappedAfterAll(async () => {
		const userInfo = await getUser(TEST_USERNAME)
		await deleteUser(userInfo.id)
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
