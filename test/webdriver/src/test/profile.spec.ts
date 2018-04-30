import * as config from '../extension/config'
import loginPage from '../page/login'
// import {
// 	editProfileInfo,
// 	returnUserProfileDetails,
// 	selectors,
// } from '../page/profile'
import {getProfs, selectors} from '../page/profile'

const smartSurveyLink = 'https://www.smartsurvey.co.uk/s/QNJEE/'

describe('Profile page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		browser.url(config.BASE_URL + '/profile')
	})

	it('Should display a feedback link with the correct survey link', () => {
		const feedback = browser.getAttribute(selectors.feedbackLink, 'href')
		expect(feedback).toEqual(smartSurveyLink)
	})

	it('Should display username field which matches email address', () => {
		const username = browser.getAttribute(selectors.emailAddress, 'innerHTML')
		expect(username).toContain(config.USERNAME)
	})

	it('Should display the first name field', () => {
		expect(browser.isVisible(selectors.givenName)).toBe(true)
	})

	it('Should display the department field', () => {
		expect(browser.isVisible(selectors.department)).toBe(true)
	})

	it('Should display the profession field', () => {
		expect(browser.isVisible(selectors.areasOfWork)).toBe(true)
	})

	it('Should display the grade field', () => {
		expect(browser.isVisible(selectors.grade)).toBe(true)
	})

	it('Should display a sign-out button with correct url', () => {
		const signOut = browser.getAttribute(selectors.signoutButton, 'href')
		expect(signOut).toEqual(config.BASE_URL + '/sign-out')
	})

	it('Should display the username field as readonly', () => {
		expect(browser.isVisible(selectors.emailAddressReadOnly)).toBe(true)
	})

	it('test', () => {
		getProfs()
	})

	// it('Should be able to update users name from the profile section', async () => {
	// 	const name = 'John'
	// 	await editProfileInfo(
	// 		selectors.changeGivenName,
	// 		selectors.editNameField,
	// 		name
	// 	)
	// 	expect(browser.isVisible(selectors.profileUpdatedBanner)).toBe(true)
	// 	const updatedName = browser.getText(selectors.givenName)
	// 	expect(updatedName).toContain(name)
	// })
})
