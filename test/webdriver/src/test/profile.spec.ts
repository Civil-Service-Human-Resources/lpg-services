import * as config from '../extension/config'
import loginPage from '../page/login'
import {editProfileInfo, selectors} from '../page/profile'

const smartSurveyLink = 'https://www.smartsurvey.co.uk/s/QNJEE/'
const contactUsEmailAddress = 'mailto:feedback@cslearning.gov.uk'

describe('Profile page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		browser.url(config.URL + '/profile')
	})

	it('Should display a feedback link with the correct survey link', async () => {
		const feedback = browser.getAttribute(selectors.feedbackLink, 'href')
		expect(feedback).toEqual(smartSurveyLink)
	})

	it('Should display username field which matches email address', async () => {
		const username = browser.getAttribute(selectors.emailAddress, 'innerHTML')
		expect(username).toContain(config.USERNAME)
	})

	it('Should display the first name field', async () => {
		expect(browser.isVisible(selectors.givenName)).toBe(true)
	})

	it('Should display the department field', async () => {
		expect(browser.isVisible(selectors.department)).toBe(true)
	})

	it('Should display the profession field', async () => {
		expect(browser.isVisible(selectors.areasOfWork)).toBe(true)
	})

	it('Should display the grade field', async () => {
		expect(browser.isVisible(selectors.grade)).toBe(true)
	})

	it('Should display a sign-out button with correct url', async () => {
		const signOut = browser.getAttribute(selectors.signoutButton, 'href')
		expect(signOut).toEqual('/sign-out')
	})

	it('Should display the username field as readonly', async () => {
		expect(browser.isVisible(selectors.emailAddressReadOnly)).toBe(true)
	})

	it('Should be able to update users name from the profile section', async () => {
		const name = 'John'
		await editProfileInfo(
			selectors.changeGivenName,
			selectors.editNameField,
			name
		)
		expect(browser.isVisible(selectors.profileUpdatedBanner)).toBe(true)
		const updatedName = browser.getText(selectors.givenName)
		expect(updatedName).toContain(name)
	})
})
