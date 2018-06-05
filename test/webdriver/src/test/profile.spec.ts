import * as config from '../extension/config'
import loginPage from '../page/login'
import {editProfileInfo, selectors} from '../page/profile'

const smartSurveyLink = 'https://www.smartsurvey.co.uk/s/QNJEE/'

describe('Profile page funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.login(config.USERNAME, config.TEST_PASSWORD)
		browser.waitForVisible(selectors.signoutButton)
		browser.url(config.BASE_URL + '/profile')
	})

	afterAll(done => {
		browser.close()
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

	it('Should update the users name from the profile section', () => {
		const name = 'John'
		editProfileInfo(selectors.changeGivenName, selectors.editNameField, name)
		const updatedName = browser.getText(selectors.givenName)
		expect(updatedName).toEqual(name)
	})

	it('Should update the users department from the profile page', () => {
		const dept = 'HM Revenue & Customs'
		editProfileInfo(
			selectors.changeDepartment,
			selectors.editDepartmentField,
			dept
		)
		const updatedDept = browser.getText(selectors.department)
		expect(updatedDept).toEqual(dept)
	})

	xit('Should change the users profession value', () => {
		//TODO: implment once new professions selector is complete
	})

	it('Should update the users grade from the profile page', () => {
		const map = new Map()
		map.set('#AA', 'Administrative level')
		map.set('#EO', 'First line manager')
		map.set('#HEO', 'Middle manager')
		map.set('#G6', 'Senior manager')
		map.set('#SCS', 'Director')
		map.set('#other', 'Other')
		for (const [code, gradeName] of map.entries()) {
			browser.click(selectors.changeGrade)
			browser.waitForVisible(code)
			browser.click(code)
			browser.click(selectors.continueButton)
			browser.waitForVisible(selectors.profileUpdatedBanner)
			const profilegrade = browser.getText(selectors.grade)
			expect(profilegrade).toEqual(gradeName)
		}
	})
})
