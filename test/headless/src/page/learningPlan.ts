import * as helper from 'extension/helper'
import * as puppeteer from 'puppeteer'

//declare var xpath: (locator: string) => HTMLElement[]

export const selectors: Record<string, string> = {
	// counterFraudCourse: 'a[href="/courses/0x390"]',
	courseTitle: '.learning__title',
	// fireAwarenessCourse: 'a[href="/courses/0x394"]',
	// firstRequiredBy: '.learning__information-desc:first-child',
	otherSection: '.lpg-other-learning',
	requiredDuration: '.resource__duration',
	requiredProgress: '.resource__status',
	requiredSection: '.lpg-required-learning',
	signoutButton: 'a[href="/sign-out"]',
	suggestedGrid: '.grid-row--suggested',
	suggestedSection: '.lpg-suggestions-section',
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
