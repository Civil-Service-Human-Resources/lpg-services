import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	usernameField: '#email-address',
	passwordField: '#password',
	loginButton:
		'#content > div.main-content > div > div > form > div:nth-child(4) > input',
	loginFailure: '#error-summary-heading-example-1',
	feedbackLink: '#content > div.phase-banner > p > span > a',
	getInTouchLink: '#content > div.main-content > div > div > p > a',
	signinButton: '#proposition-links > li > a',
	profileUserName: '#userName',
	homeNavButton: '#proposition-links > li:nth-child(1) > a',
	signoutButton: 'a[href="/sign-out"]',
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
