import * as puppeteer from 'puppeteer'
import * as helper from 'extension/helper'
import {wrappedBeforeAll, wrappedAfterAll} from 'extension/testsetup'
import {createUser, updateUser} from 'extension/user'
import * as xapi from 'extension/xapi'
import {loginToCsl} from 'page/login'
import {selectors} from 'page/learningPlan'

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

describe('recurring courses functionality', () => {
	let page: puppeteer.Page
	let userId: string

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('recurring courses')
		page = await session.newPage()
		await page.authenticate({
			username: DIALOG_USERNAME,
			password: DIALOG_PASSWORD,
		})
		await page.goto(URL)
		userId = await createUser(TEST_USERNAME, TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G7')
		await loginToCsl(page, USERNAME, PASS)
		await page.waitFor(selectors.signoutButton)
	})

	wrappedAfterAll(async () => {
		await page.close()
	})

	it('Should display recurring courses with a required by date', async () => {
		const requiredByText = await helper.getText(selectors.firstRequiredBy, page)
		expect(requiredByText).toEqual('Required by 31/03/2018')
	})

	it('Should hide completed course before required by date', async () => {

        expect(await helper.checkElementIsPresent(selectors.counterFraudCourse, page)).toBe(true)

		// Counter fraud, ...
		await xapi.addStatement(
			userId,
			'0x390',
			xapi.Verb.Completed,
			new Date()
		)

        expect(await helper.checkElementIsPresent(selectors.counterFraudCourse, page)).toBe(false)
    })

	it('Should show completed course after previous required by date passes', async () => {
		// Basic fire awareness
		await xapi.addStatement(
            userId,
			'0x394',
			xapi.Verb.Completed,
			new Date(2017, 0, 1)
		)

		expect(await helper.checkElementIsPresent(selectors.fireAwarenessCourse, page)).toBe(true)
	})
})
