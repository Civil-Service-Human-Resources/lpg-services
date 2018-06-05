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
})
