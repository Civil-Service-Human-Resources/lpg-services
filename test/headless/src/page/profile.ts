import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	feedbackLink: '#content > div.phase-banner > p > span > a',
	userName: '#userName',
	firstName: '#givenName',
	department: '#department',
	profession: '#profession',
	grade: '#grade',
	profileForm: '.form-control',
	saveProfileButton: '#content > div.main-content > div > div > form > input',
	profileUpdatedMessage: '#content > div.main-content > div > div > div > h1',
	signoutButton: '#proposition-links > li > a',
	profilePageButton: '#proposition-links > li > a',
	incompleteProfileError: '#content > div.main-content > div > div > div',
	updateProfileError:
		'#content > div.main-content > div > div > div > p:nth-child(2)',
	firstNameFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(2) > span',
	departmentFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(3) > span',
	professionFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(4) > span',
	gradeFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(5) > span',
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

export async function setUserProfileDetails(page: puppeteer.Page) {
	await page.type(selectors.firstName, 'Name')
	await page.type(selectors.department, 'co')
	await page.type(selectors.profession, 'HR')
	await page.type(selectors.grade, 'G7')
	await page.click(selectors.saveProfileButton)
	await page.waitFor(selectors.profileUpdatedMessage)
}

export async function setProfileFieldToEmptyAndSave(
	selector: string,
	page: puppeteer.Page
) {
	await page.type(selector, ' ')
	await page.click(selectors.saveProfileButton)
}
