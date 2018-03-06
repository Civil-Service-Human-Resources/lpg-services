import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	department: '#department',
	departmentFieldError: '.lpg-department-error',
	feedbackLink: '.lpg-feedback-link',
	firstName: '#givenName',
	firstNameFieldError: '.lpg-name-error',
	grade: '#grade',
	gradeFieldError: '.lpg-grade-error',
	incompleteProfileError: '.lpg-incomplete-profile',
	profession: '#profession',
	professionFieldError: '.lpg-profession-error',
	profileForm: '.form-control',
	profilePageButton: '#proposition-links > li > a',
	profileUpdatedMessage: '.lpg-profile-updated',
	saveProfileButton: 'input[value="Continue"]',
	signoutButton: 'a[href="/sign-out"]',
	updateProfileError: '#error-summary-heading-example-1',
	userName: '#userName',
}

export async function returnUserProfileDetails(page: puppeteer.Page) {
	return page.$$eval('.form-control', values => {
		const profile: Record<string, string> = {}
		for (const val of values) {
			const attrName = val.getAttribute('name')
			if (attrName) {
				profile[attrName] = val.getAttribute('value') || ''
			}
		}
		return profile
	})
}

export async function setProfileFieldToEmptyAndSave(
	selector: string,
	page: puppeteer.Page
) {
	await page.type(selector, ' ')
	await page.click(selectors.saveProfileButton)
}

export async function setUserProfileDetails(page: puppeteer.Page) {
	await page.type(selectors.firstName, 'Name')
	await page.type(selectors.department, 'co')
	await page.type(selectors.profession, 'HR')
	await page.type(selectors.grade, 'G7')
	await page.click(selectors.saveProfileButton)
	await page.waitFor(selectors.profileUpdatedMessage)
}
