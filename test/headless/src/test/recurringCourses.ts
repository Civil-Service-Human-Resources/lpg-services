import * as puppeteer from 'puppeteer'
import * as helper from 'extension/helper'
import {wrappedBeforeAll, wrappedAfterAll} from 'extension/testsetup'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import * as xapi from 'extension/xapi'
import {loginToCsl} from 'page/login'
import {selectors} from 'page/learningPlan'
import * as config from 'test/config'

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

let TEST_USERNAME = genUserEmail()

describe('recurring courses functionality', () => {
	let page: puppeteer.Page
	let userId: string

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('recurring courses')
		page = await session.newPage()
		await page.authenticate({
			username: config.BASIC_AUTH_USERNAME,
			password: config.BASIC_AUTH_PASSWORD,
		})
		await page.goto(config.URL)
		userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G7')
		await loginToCsl(page, TEST_USERNAME, config.TEST_PASSWORD)
		await page.waitFor(selectors.signoutButton)
	})

	wrappedAfterAll(async () => {
		const userInfo = await getUser(TEST_USERNAME)
		await deleteUser(userInfo.id)
		await page.close()
	})

	xit('Should display recurring courses with a required by date', async () => {
		const requiredByText = await helper.getText(selectors.firstRequiredBy, page)
		expect(requiredByText).toEqual('Required by 31/03/2018')
	})

	xit('Should hide completed course before required by date', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.counterFraudCourse, page)
		).toBe(true)

		// Counter fraud, ...
		await xapi.addStatement(userId, '0x390', xapi.Verb.Completed, new Date())

		expect(
			await helper.checkElementIsPresent(selectors.counterFraudCourse, page)
		).toBe(false)
	})

	xit('Should show completed course after previous required by date passes', async () => {
		// Basic fire awareness
		await xapi.addStatement(
			userId,
			'0x394',
			xapi.Verb.Completed,
			new Date(2017, 0, 1)
		)

		expect(
			await helper.checkElementIsPresent(selectors.fireAwarenessCourse, page)
		).toBe(true)
	})
})
