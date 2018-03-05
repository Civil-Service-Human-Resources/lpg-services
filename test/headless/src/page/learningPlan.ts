import * as helper from 'extension/helper'
import * as puppeteer from 'puppeteer'

//declare var xpath: (locator: string) => HTMLElement[]

export const selectors: Record<string, string> = {
	counterFraudCourse: 'a[href="/courses/0x390"]',
	courseTitle: 'h1.heading-large',
	fireAwarenessCourse: 'a[href="/courses/0x394"]',
	firstRequiredBy: '.learning__information-desc:first-child',
	learningHeader: '.basket__heading',
	learningPlanSection: 'h2.heading-small',
	requiredCourseType: 'learning__information-list',
	requiredDuration: 'learning__information-list',
	requiredProgress: '.learning__progress',
	requiredSection: 'h3.heading-small',
	signoutButton: 'a[href="/sign-out"]',
	suggestedButton: 'p > a[href="/suggested-for-you"]',
	suggestedSection: 'h2.heading-large',
}

export async function returnXpathStr(
	page: puppeteer.Page,
	selector: string
): Promise<string> {
	const statuses = await page.evaluate(sel => {
		const elems = helper.xpath(sel)
		return elems.map(span => span.textContent)
	}, selector)
	return statuses
}

export async function videoInProgress(page: puppeteer.Page) {
	await page.click(selectors.suggestedButton)
}
