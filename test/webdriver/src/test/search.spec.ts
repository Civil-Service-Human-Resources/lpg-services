import * as config from '../extension/config'
import loginPage from '../page/login'
import {search, searchResults, selectors} from '../page/search'

describe('Search page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
	})

	it('Should display the search box on the home page', () => {
		expect(browser.isVisible(selectors.searchBox)).toBe(true)
	})

	it('Should display the search button on the home page', () => {
		expect(browser.isVisible(selectors.searchButton)).toBe(true)
	})

	it('Should allow the user to search for a valid term and return results', () => {
		const searchTerm = 'something'
		search(searchTerm)
		const termSearched = browser.getText(selectors.searchTerm)
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
		browser.url(config.BASE_URL + 'search?q=' + searchTerm)
		const termSearched = browser.getText(selectors.termSearched)
		expect(termSearched).toContain(searchTerm)
	})

	it('Should display no search results for an invalid search term', async () => {
		search('sometermthatdoesntexist')
		const amount = searchResults()
		expect(amount).toContain('no')
	})

	it('Should display add to learning plan option from the results', async () => {
		search('the')
		expect(browser.isVisible(selectors.addToPlan)).toBe(true)
	})

	it('Should display book button for classroom courses', async () => {
		search('qualification')
		const bookUrl = browser.getAttribute('href')
		expect(browser.isVisible(selectors.bookCourse)).toBe(true)
		expect(bookUrl).toContain('book')
		expect(bookUrl).toContain('choose-date')
	})

	it('Should add to learning plan from search', async () => {
		search('the')
		const courseName = browser.getText(selectors.courseName)
		browser.click(selectors.addToPlan)
		browser.waitForVisible(selectors.addedNotification)
		const addedCourse = browser.getText(selectors.addedNotification)
		expect(addedCourse).toEqual(courseName)
	})

	it('Should show the number of modules a course comprises of', async () => {
		search('fire')
		const course = browser.getText(selectors.course)
		expect(course).toContain('This course comprises of')
	})
})
