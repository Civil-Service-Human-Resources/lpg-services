import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	department: '#department',
	departmentFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(3) > span',
	feedbackLink: '#content > div.phase-banner > p > span > a',
	firstName: '#givenName',
	firstNameFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(2) > span',
	grade: '#grade',
	gradeFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(5) > span',
	incompleteProfileError: '#content > div.main-content > div > div > div',
	profession: '#profession',
	professionFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(4) > span',
	profileForm: '.form-control',
	profilePageButton: '#proposition-links > li > a',
	profileUpdatedMessage: '#content > div.main-content > div > div > div > h1',
	saveProfileButton: '#content > div.main-content > div > div > form > input',
	signoutButton: 'a[href="/sign-out"]',
	updateProfileError:
		'#content > div.main-content > div > div > div > p:nth-child(2)',
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
