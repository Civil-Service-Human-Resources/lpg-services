import * as puppeteer from 'puppeteer'

export const selectors: Record<string, string> = {
	searchAction: '.result__action',
	searchBox: '.search-box__submit',
	searchButton: '#q',
	searchNextPage: '.pager__next',
	searchPagination: '.pager__list',
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
	await page.type(searchTerm, selectors.searchBox)
	await page.click(selectors.searchButton)
}
