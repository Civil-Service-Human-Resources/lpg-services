import * as config from '../extension/config'

import loginPage from '../page/login'
import {search, selectors} from '../page/search'

describe('View learning materials', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.testAccountLogin()
		browser.waitForVisible(selectors.signoutButton)
		browser.url(config.BASE_URL)
	})

	afterAll(done => {
		browser.close()
	})

	it('Should search for a youtube course and open it', () => {
		search('start with why')
		const courseName = browser.getText(selectors.courseName)
		browser.click(selectors.courseName)
		expect(courseName[0]).toEqual(browser.getText(selectors.pageHeading))
	})
})
