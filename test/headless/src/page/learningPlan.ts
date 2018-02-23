import * as puppeteer from 'puppeteer'
import * as helper from 'extension/helper'
//declare var xpath: (locator: string) => HTMLElement[]

export const selectors: Record<string, string> = {
	signoutButton: 'a[href="/sign-out"]',
	learningHeader: '.basket__heading',
	requiredHeading: 'h3.heading-small',
	requiredProgress: '.learning__progress',
	requiredCourseType: 'learning__information-list',
	requiredDuration: 'learning__information-list',
	courseTitle: 'h1.heading-large',
	learningPlanSection: 'h2.heading-small',
	suggestedSection: 'h2.heading-large',
	suggestedButton: 'p > a[href="/suggested-for-you"]',
	counterFraudCourse: 'a[href="/courses/0x390"]',
	fireAwarenessCourse: 'a[href="/courses/0x394"]',
	firstRequiredBy: '.learning__information-desc:first-child',
}

export async function returnXpathStr(
	page: puppeteer.Page,
	selector: string
): Promise<string> {
	const statuses = await page.evaluate(selector => {
		const elems = helper.xpath(selector)
		return elems.map(span => span.textContent)
	}, selector)
	return statuses
}

export async function videoInProgress(page: puppeteer.Page) {
	await page.click(selectors.suggestedButton)
}
