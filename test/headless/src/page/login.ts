import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	//TODO:(Will) add classes to all
	feedbackLink: '.lpg-feedback-link',
	getInTouchLink: '.lpg-get-in-touch',
	loginButton: 'input[value="Continue"]',
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
	await page.waitForNavigation
	await page.waitFor(selectors.signoutButton, {timeout: 10000})
}
