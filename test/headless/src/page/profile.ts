import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	feedbackLink: '#content > div.phase-banner > p > span > a',
	department: '#department',
	profession: '#profession',
	grade: '#grade',
	saveProfileButton: '#content > div.main-content > div > div > form > input',
	signoutButton: '#proposition-links > li:nth-child(4) > a',
	profilePageButton: '#proposition-links > li:nth-child(2) > a',
}

export async function setUserProfileDetails(page: puppeteer.Page) {
	await page.type(selectors.department, 'department')
	await page.type(selectors.profession, 'profession')
	await page.type(selectors.grade, 'grade')
	await page.click(selectors.saveProfileButton)
}
