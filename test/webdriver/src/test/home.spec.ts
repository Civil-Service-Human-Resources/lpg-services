import * as config from '../extension/config'
import loginPage, {selectors} from '../page/login'

describe('Login page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
	})

	it('Should display the login page username field', () => {
		const username = browser.isExisting(selectors.usernameField)
		expect(username).toBe(true)
	})

	it('Should display the login page password field', () => {
		const password = browser.isExisting(selectors.passwordField)
		expect(password).toBe(true)
	})

	it('Login to the LPG site', () => {
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		const signedIn = browser.isExisting(selectors.signoutButton)
		expect(signedIn).toBe(true)
	})
})
