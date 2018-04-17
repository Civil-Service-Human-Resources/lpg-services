import * as config from 'extension/config'
import loginPage, {selectors} from 'page/login'

describe('Login page funtionality', () => {
	beforeAll(done => {
		browser.url('https://co:70Whitehall@lpg.test.cshr.digital/sign-in')
	})
	it('Login to the LPG site', () => {
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		//const signedIn = browser.isExisting(selectors.signoutButton)
		// expect(signedIn).toBe(true)
		//expect(browser.isExisting(selectors.signoutButton)).toBe(true)
	})
})
