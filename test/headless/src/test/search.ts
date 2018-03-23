import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import {loginToCsl} from 'page/login'
import {selectors} from 'page/search'
import * as puppeteer from 'puppeteer'

function genUserEmail() {
	return `test${Date.now()}@b.gov.uk`
}

const TEST_USERNAME = genUserEmail()

describe('feedback form functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('feedback form')
		page = await session.newPage()
		await page.authenticate({
			password: config.BASIC_AUTH_PASSWORD,
			username: config.BASIC_AUTH_USERNAME,
		})
		await page.goto(config.URL)
		const userId = await createUser(TEST_USERNAME, config.TEST_PASSWORD)
		await updateUser(userId, TEST_USERNAME, 'Test', 'co', 'commercial', 'G6')
		await loginToCsl(page, config.USERNAME, config.PASSWORD)
		await page.waitFor(selectors.signoutButton)
	})

	wrappedAfterAll(async () => {
		const userInfo = await getUser(TEST_USERNAME)
		await deleteUser(userInfo.id)
		await page.close()
	})

	it('Should display the search box on the home page', async () => {
		expect(await helper.checkElementIsPresent(selectors.searchBox, page)).toBe(
			true
		)
	})

	it('Should display the search button on the home page', async () => {
		expect(
			await helper.checkElementIsPresent(selectors.searchButton, page)
		).toBe(true)
	})

	it('Should allow the user to search for a valid term and return results', async () => {
		const searchTerm = 'something'
	})
})
