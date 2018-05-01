import * as config from '../extension/config'
import {completeFeedback, selectors} from '../page/globals'
import loginPage from '../page/login'

describe('feedback form functionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.testAccountLogin()
	})

	it('Should display the feedback link on the home page', () => {
		expect(browser.waitForVisible(selectors.feedbackPrompt)).toBe(true)
	})

	it('Should display two text fields and a send button when feedback link is clicked', () => {
		browser.click(selectors.feedbackPrompt)
		expect(browser.waitForVisible(selectors.feedbackDoingField)).toBe(true)
		expect(browser.waitForVisible(selectors.feedbackWrongField)).toBe(true)
		expect(browser.waitForVisible(selectors.feedbackSubmitButton)).toBe(true)
	})

	it('Should hide hide two text fields and a send button when feedback link is clicked', () => {
		browser.click(selectors.feedbackPrompt)
		expect(browser.isVisible(selectors.feedbackDetails)).toBe(false)
	})

	it('Should send feedback when the information is entered and submitted', () => {
		browser.click(selectors.feedbackPrompt)
		completeFeedback()
		expect(browser.isVisible(selectors.feedbackDetails)).toBe(true)
	})

	it('Should display the feedback link on the profile page', () => {
		browser.url(config.BASE_URL + '/profile')
		expect(browser.waitForVisible(selectors.feedbackPrompt)).toBe(true)
	})

	it('Should display the feedback link on the learner record page', () => {
		browser.url(config.BASE_URL + '/learning-record')
		expect(browser.waitForVisible(selectors.feedbackPrompt)).toBe(true)
	})

	it('Should display the feedback link on the learner record page', () => {
		browser.url(config.BASE_URL + '/suggestions-for-you')
		expect(browser.waitForVisible(selectors.feedbackPrompt)).toBe(true)
	})

	it('Should display feedback link on the search page', async () => {
		browser.url(config.BASE_URL + '/search')
		expect(browser.waitForVisible(selectors.feedbackPrompt)).toBe(true)
	})

	it('Should display feedback link on the sign-in page', async () => {
		browser.url(config.BASE_URL + '/sign-out')
		expect(browser.waitForVisible(selectors.feedbackPrompt)).toBe(true)
	})
})
