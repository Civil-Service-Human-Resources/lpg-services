//login page
import * as puppeteer from 'puppeteer'

//selectors
export const selectors: {[key: string]: string} = {
	usernameField: '#email-address',
	passwordField: '#password',
	loginButton:
		'#content > div.main-content > div > div > form > div:nth-child(4) > input',
	loginSucess: '#emailaddress',
	loginFailure: '#error-summary-heading-example-1',
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
