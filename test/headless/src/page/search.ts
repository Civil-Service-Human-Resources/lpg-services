import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	addToPlan: '.lpg-add-from-search',
	addedNotification: '.banner__heading-large',
	bookCourse: '.lpg-book-course',
	course: '.discite__item',
	courseName: '.lpg-course-name',
	searchAction: '.result__action',
	searchBox: '#q',
	searchButton: '.search-box__submit',
	searchNextPage: '.pager__next',
	searchPagination: '.pager__controls',
	searchResultsAmount: '.lpg-search-amount',
	searchSummary: '.pager__summary',
	signoutButton: 'a[href="/sign-out"]',
	termSearched: '.lpg-search-query',
}

export async function searchResults(page: puppeteer.Page) {
	return page.$eval(selectors.searchResultsAmount, ele => {
		return ele.innerHTML
	})
}

export async function search(searchTerm: string, page: puppeteer.Page) {
	await page.waitForSelector(selectors.searchBox)
	await page.click(selectors.searchBox)
	await page.$eval(selectors.searchBox, (input: any) => (input.value = ''))
	await page.type(selectors.searchBox, searchTerm)
	await page.click(selectors.searchButton)
	await page.waitForSelector(selectors.termSearched)
}
