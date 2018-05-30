import * as config from '../extension/config'
import {selectors} from '../page/globals'
import loginPage from '../page/login'

describe('Footer for LPG', () => {
	beforeAll(done => {
		browser.url(config.URL)
	})

	it('Display footer author', () => {
		expect(browser.isVisible(selectors.author)).toBe(true)
	})
	it('Display footer cookies', () => {
		expect(browser.isVisible(selectors.cookies)).toBe(true)
	})
	it('Display footer copywrite', () => {
		expect(browser.isVisible(selectors.copyright)).toBe(true)
	})
	it('Display footer license', () => {
		expect(browser.element(selectors.license).isVisible()).toBe(true)
	})
	xit('Display footer privacy', () => {
		expect(browser.isVisible(selectors.privacy)).toBe(true)
	})

	it('Display footer author logged in', () => {
		loginPage.testAccountLogin()
		expect(browser.isVisible(selectors.author)).toBe(true)
	})

	it('Display footer cookies logged in', () => {
		expect(browser.isVisible(selectors.cookies)).toBe(true)
	})

	it('Display footer copywrite logged in', () => {
		expect(browser.isVisible(selectors.copyright)).toBe(true)
	})

	it('Display footer license logged in', () => {
		expect(browser.element(selectors.license).isVisible()).toBe(true)
	})

	it('Display footer privacy logged in', () => {
		expect(browser.isVisible(selectors.privacy)).toBe(true)
	})
})
