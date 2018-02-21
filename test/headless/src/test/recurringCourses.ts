import * as puppeteer from 'puppeteer'
import * as helper from '../extension/helper'
import {wrappedBeforeAll, wrappedAfterAll} from '../extension/testsetup'
import {createUser, updateUser} from '../extension/user'
import * as xapi from '../extension/xapi'
import {loginToCsl, selectors} from '../page/login'

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

	it('Should display recurring courses with a required by date', async () => {})

	it('Should hide completed course before required by date', async () => {
		// Counter fraud, ...
		await xapi.addStatement(
			'f6bb29cb-876f-45fa-b851-34f6569d35d2',
			'0x390',
			xapi.Verb.Completed,
			new Date()
		)
	})

	it('Should show completed course after required by date passes', async () => {
		// Basic fire awareness
		await xapi.addStatement(
			'f6bb29cb-876f-45fa-b851-34f6569d35d2',
			'0x394',
			xapi.Verb.Completed,
			new Date(2016, 0, 1)
		)
	})
})
