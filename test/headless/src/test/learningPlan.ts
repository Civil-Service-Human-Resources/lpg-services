import * as helper from 'extension/helper'
import * as puppeteer from 'puppeteer'
import {selectors} from 'page/learningPlan'
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
		const session = await helper.getSession('learning plan')
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
