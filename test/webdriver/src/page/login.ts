export const selectors: Record<string, string> = {
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

export class LoginPage {
	public login(username: string, password: string) {
		browser.setValue(selectors.usernameField, username)
		browser.setValue(selectors.passwordField, password)
		browser.click(selectors.loginButton)
	}
}

const loginPage = new LoginPage()
export default loginPage
