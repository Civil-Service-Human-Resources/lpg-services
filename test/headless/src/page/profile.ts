import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	areasOfWork: '.lpg-areas-of-work',
	changeAreasOfWork: 'a[href="/profile/areas-of-work"]',
	changeDepartment: 'a[href="/profile/department"]',
	changeGivenName: 'a[href="/profile/given-name"]',
	changeGrade: 'a[href="/profile/grade"]',
	continueButton: 'input[value="Continue"]',
	department: '.lpg-department',
	departmentFieldError: '.lpg-department-error',
	editDepartmentField: '#department',
	editNameField: '#given-name',
	emailAddress: '.lpg-email-address',
	emailAddressReadOnly: '.lpg-email-address-read-only',
	feedbackLink: '.lpg-feedback-link',
	givenName: '.lpg-given-name',
	givenNameFieldError: '.lpg-name-error',
	grade: '.lpg-grade',
	gradeFieldError: '.lpg-grade-error',
	incompleteProfileError: '.lpg-incomplete-profile',
	profileForm: '.form-control',
	profilePageButton: '#proposition-links > li > a',
	profileUpdatedBanner: '.banner--confirmation',
	signoutButton: 'a[href="/sign-out"]',
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

export async function editAreaOfWork(page: puppeteer.Page) {
	await page.click(selectors.updateAreasOfWork)
}

export async function editProfileInfo(
	profileField: string,
	selector: string,
	updateValue: string,
	page: puppeteer.Page
) {
	await page.click(profileField)
	await page.waitForSelector(selector)
	await page.$eval(selector, (input: any) => (input.value = ''))
	await page.type(selector, updateValue)
	await page.click(selectors.continueButton)
	await page.waitForSelector(selectors.profileUpdatedBanner)
}
