import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	feedbackLink: '#content > div.phase-banner > p > span > a',
	getInTouchLink: '#content > div.main-content > div > div > p > a',
	homeNavButton: '#proposition-links > li:nth-child(1) > a',
	loginButton:
		'#content > div.main-content > div > div > form > div:nth-child(4) > input',
	loginFailure: '#error-summary-heading-example-1',
	passwordField: '#password',
	profileUserName: '#userName',
	signinButton: '#proposition-links > li > a',
	signoutButton: 'a[href="/sign-out"]',
	usernameField: '#email-address',
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
