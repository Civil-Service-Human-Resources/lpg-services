import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	usernameField: '#email-address',
	passwordField: '#password',
	loginButton:
		'#content > div.main-content > div > div > form > div:nth-child(4) > input',
	loginSucess: '#userName',
	loginFailure: '#error-summary-heading-example-1',
	feedbackLink: '#content > div.phase-banner > p > span > a',
	getInTouchLink: '#content > div.main-content > div > div > p > a',
	signinButton: '#proposition-links > li > a',
	profilePageButton: '#proposition-links > li:nth-child(2) > a',
}

export async function loginToCsl(
	page: puppeteer.Page,
	username: string,
	password: string
) {
	await page.type(selectors.usernameField, username)
	await page.type(selectors.passwordField, password)
	await page.click(selectors.loginButton)
}
