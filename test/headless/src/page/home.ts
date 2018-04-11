import * as helper from 'extension/helper'
import * as puppeteer from 'puppeteer'

//declare var xpath: (locator: string) => HTMLElement[]

export const selectors: Record<string, string> = {
	// counterFraudCourse: 'a[href="/courses/0x390"]',
	bannerConfirmation: '.banner__heading-large',
	courseDuration: 'lpg-course-duration',
	courseInfoTitle: '.heading--page-heading',
	courseLink: '.lpg-course-link',
	courseName: '.lpg-course-name',
	courseTitle: '.learning__title',
	courseType: '.lpg-course-type',
	// fireAwarenessCourse: 'a[href="/courses/0x394"]',
	// firstRequiredBy: '.learning__information-desc:first-child',
	otherSection: '.lpg-other-learning-heading',
	otherSectionCourse: '.lpg-other-learning .lpg-course-name',
	requiredDuration: '.resource__duration',
	requiredProgress: '.resource__status',
	requiredSection: '.lpg-required-learning',
	signoutButton: 'a[href="/sign-out"]',
	suggestedGrid: '.grid-row--suggested',
	suggestedSection: '.lpg-suggestions-section',
	tileAdd: '.lpg-add-tile',
	tileRemove: '.lpg-remove-tile',
	tileTitle: '.lpg-title-tile',
}

export async function interactSuggested(
	selector: string,
	interaction: string,
	page: puppeteer.Page
) {
	const courseTitle = await helper.getText(selector, page)
	await page.click(interaction)
	return courseTitle
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
