import * as config from '../extension/config'
import {selectors} from '../page/home'
import loginPage from '../page/login'

describe('Home page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.testAccountLogin()
	})

	afterAll(done => {
		browser.close()
	})

	it('Should display the required learning section', () => {
		browser.waitForVisible(selectors.signoutButton)
		expect(browser.isVisible(selectors.requiredSection)).toBe(true)
	})

	it('Should display the other learning section', () => {
		expect(browser.isVisible(selectors.otherSection)).toBe(true)
	})

	it('Should display mandatory learning on first login', () => {
		const learnCount = browser.elements(selectors.courseName).value.length
		expect(learnCount).toBeGreaterThanOrEqual(3)
	})

	it('Should display a cookies notification at the top of the page', () => {
		expect(browser.isVisible(selectors.cookieMessage)).toBe(true)
	})

	it('Should link to the cookies page', () => {
		browser.click(selectors.cookieLink)
		const url = browser.getUrl()
		expect(url).toEqual(config.BASE_URL + '/cookies')
	})

	it('Should hide cookie message after the user has viewed it', () => {
		browser.url(config.BASE_URL)
		expect(!browser.isVisible(selectors.cookieMessage)).toBe(true)
	})
})
