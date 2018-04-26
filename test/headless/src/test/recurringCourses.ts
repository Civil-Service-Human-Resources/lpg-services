import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import * as xapi from 'extension/xapi'
import {selectors} from 'page/home'
import {loginToCsl} from 'page/login'
import * as puppeteer from 'puppeteer'

function genUserEmail() {
	return `test${Date.now()}@c.gov.uk`
}

const TEST_USERNAME = genUserEmail()

describe('recurring courses functionality', () => {
	let page: puppeteer.Page
	let userId: string

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('recurring courses')
		page = await session.newPage()
		if (config.PROFILE !== 'local') {
			await page.authenticate({
				password: config.BASIC_AUTH_PASSWORD,
				username: config.BASIC_AUTH_USERNAME,
			})
		}
		await page.goto(config.URL)
		userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G6')
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
		expect(requiredByText).toContain('Required by 31/03/2018')
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
