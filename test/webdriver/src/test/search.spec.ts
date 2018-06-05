import * as config from '../extension/config'
import loginPage from '../page/login'
import {search, searchResults, selectors} from '../page/search'

describe('Search page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		browser.url(config.BASE_URL)
	})

	afterAll(done => {
		browser.close()
	})

	//TODO: Blocked by LPFG-391
	xit('Should add to learning plan from search', async () => {
		search('the')
		const courseName = browser.getText(selectors.courseName)
		browser.click(selectors.addToPlan)
		browser.waitForVisible(selectors.addedNotification)
		const addedCourse = browser.getText(selectors.addedNotification)
		expect(addedCourse).toEqual(courseName)
	})

	it('Should display the search box on the home page', () => {
		expect(browser.element(selectors.searchBox).isVisible()).toBe(true)
	})

	it('Should display the search button on the home page', () => {
		expect(browser.isVisible(selectors.searchButton)).toBe(true)
	})

	it('Should display the search box on the suggested page', () => {
		browser.url(config.BASE_URL + '/suggestions-for-you')
		expect(browser.isVisible(selectors.searchBox)).toBe(true)
	})

	it('Should display the search button on the suggested page', () => {
		browser.url(config.BASE_URL + '/suggestions-for-you')
		expect(browser.isVisible(selectors.searchButton)).toBe(true)
	})

	it('Should allow the user to search for a valid term and return results', () => {
		const searchTerm = 'something'
		search(searchTerm)
		const termSearched = browser.getAttribute(selectors.searchBox, 'value')
		expect(termSearched).toContain(searchTerm)
	})

	it('Should display pagination for a search term which returns > 10 results', async () => {
		search('the')
		expect(browser.isVisible(selectors.searchPagination)).toBe(true)
	})

	it('Should allow the user to page through the search results', async () => {
		search('the')
		browser.click(selectors.searchNextPage)
		browser.waitForVisible(selectors.searchSummary)
		const pageSummary = browser.getText(selectors.searchSummary)
		expect(pageSummary).toContain('11')
	})

	it('Should allow the user to search via query string', async () => {
		const searchTerm = 'the'
		browser.url(config.BASE_URL + '/search?q=' + searchTerm)
		const termSearched = browser.getText(selectors.termSearched)
		expect(termSearched).toContain(searchTerm)
	})

	it('Should display no search results for an invalid search term', async () => {
		search('sometermthatdoesntexist')
		const amount = searchResults()
		expect(amount).toContain('no')
	})

	xit('Should display add to learning plan option from the results', async () => {
		search('the')
		expect(browser.isExisting(selectors.addToPlan)).toBe(true)
	})

	it('Should display book button for classroom courses', async () => {
		search('qualification')
		const bookUrl = browser.getAttribute(selectors.bookCourse, 'href')
		expect(browser.isExisting(selectors.bookCourse)).toBe(true)
		expect(bookUrl[0]).toContain('book')
		expect(bookUrl[0]).toContain('choose-date')
	})

	it('Should show the number of modules a course comprises of', async () => {
		search('health')
		const course = browser.getText(selectors.course)
		expect(course[0]).toEqual('This course comprises of 6 modules')
	})
})
