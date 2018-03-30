import * as config from 'extension/config'
import * as helper from 'extension/helper'
import {wrappedAfterAll, wrappedBeforeAll} from 'extension/testsetup'
import {createUser, deleteUser, getUser, updateUser} from 'extension/user'
import {loginToCsl} from 'page/login'
import {search, searchResults, selectors} from 'page/search'
import * as puppeteer from 'puppeteer'

function genUserEmail() {
	return `test${Date.now()}@b.gov.uk`
}

const TEST_USERNAME = genUserEmail()

describe('search functionality', () => {
	let page: puppeteer.Page

	wrappedBeforeAll(async () => {
		const session = await helper.getSession('feedback form')
		page = await session.newPage()
		if (config.PROFILE !== 'local') {
			await page.authenticate({
				password: config.BASIC_AUTH_PASSWORD,
				username: config.BASIC_AUTH_USERNAME,
			})
		}
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
		search(searchTerm, page)
		const termSearched = await helper.getText(selectors.termSearched, page)
		expect(termSearched).toEqual(searchTerm)
	})

	it('Should display pagination for a search term which returns > 10 results', async () => {
		search('the', page)
		const amount = searchResults(page)
		expect(amount).toBeGreaterThan(10)
		expect(
			await helper.checkElementIsPresent(selectors.searchPagination, page)
		).toBe(true)
	})

	it('Should allow the user to page through the search results', async () => {
		search('the', page)
		await page.click(selectors.searchNextPage)
		const pageSummary = await helper.getText(selectors.searchSummary, page)
		expect(pageSummary).toContain('11')
	})

	it('Should allow the user to search via query string', async () => {
		const searchTerm = 'the'
		await page.goto(config.BASE_URL + '/search?q=' + searchTerm)
		const termSearched = await helper.getText(selectors.termSearched, page)
		expect(termSearched).toEqual(searchTerm)
	})

	it('Should display no search results for an invalid search term', async () => {
		search('sometermthatdoesntexist', page)
		const amount = searchResults(page)
		expect(amount).toEqual('no')
	})

	// it('Should display add to learning plan option for all listed results', async () => {

	// })
})
