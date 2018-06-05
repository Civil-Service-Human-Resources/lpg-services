import * as config from '../extension/config'
import loginPage, {selectors} from '../page/login'

const smartSurveyLink = 'https://www.smartsurvey.co.uk/s/QNJEE/'
const contactUsEmailAddress = 'mailto:feedback@cslearning.gov.uk'

describe('Login page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
	})

	afterAll(done => {
		browser.close()
	})

	it('Should display the login page username field', () => {
		const username = browser.isExisting(selectors.usernameField)
		expect(username).toBe(true)
	})

	it('Should display the login page password field', () => {
		const password = browser.isExisting(selectors.passwordField)
		expect(password).toBe(true)
	})

	it('Should display an error message when the incorrect login details are entered', () => {
		loginPage.login('error@wron.g', 'details')
		expect(browser.isVisible(selectors.loginFailure)).toBe(true)
	})

	it('Should display a feedback link with the correct survey link', () => {
		const feedback = browser.getAttribute(selectors.feedbackLink, 'href')
		expect(feedback).toEqual(smartSurveyLink)
	})

	xit('Should display a link to the user allowing them to get in touch to create account', () => {
		const contact = browser.getAttribute(selectors.getInTouchLink, 'href')
		expect(contact).toEqual(contactUsEmailAddress)
	})

	it('Login to the LPG site', () => {
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		const signedIn = browser.isExisting(selectors.signoutButton)
		expect(signedIn).toBe(true)
	})
})
