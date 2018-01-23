//login page
import * as puppeteer from 'puppeteer'

//selectors
export const selectors: {[key: string]: string} = {
	usernameField:
		'#content > div > div > div > div > div > div > form > fieldset:nth-child(2) > input',
	passwordField:
		'#content > div > div > div > div > div > div > form > fieldset:nth-child(3) > input',
	loginButton:
		'#content > div > div > div > div > div > div > form > div > input',
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
