import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	feedbackLink: '#content > div.phase-banner > p > span > a',
	userName: '#userName',
	department: '#department',
	profession: '#profession',
	grade: '#grade',
	profileForm: '.form-control',
	saveProfileButton: '#content > div.main-content > div > div > form > input',
	signoutButton: '#proposition-links > li:nth-child(3) > a',
	profilePageButton: '#proposition-links > li:nth-child(2) > a',
	incompleteProfileError: '#content > div.main-content > div > div > div',
	updateProfileError:
		'#content > div.main-content > div > div > div > p:nth-child(2)',
	departmentFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(2) > span',
	professionFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(3) > span',
	gradeFieldError:
		'#content > div.main-content > div > div > form > div:nth-child(4) > span',
}

export async function setUserProfileDetails(page: puppeteer.Page) {
	await page.type(selectors.department, 'department')
	await page.type(selectors.profession, 'profession')
	await page.type(selectors.grade, 'grade')
	await page.click(selectors.saveProfileButton)
}

export async function setProfileFieldToEmptyAndSave(
	selector: string,
	page: puppeteer.Page
) {
	await page.type(selector, ' ')
	await page.click(selectors.saveProfileButton)
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
