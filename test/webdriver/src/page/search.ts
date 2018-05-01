import * as config from '../extension/config'

export const selectors: Record<string, string> = {
	addToPlan: '.lpg-add-from-search',
	addedNotification: '.banner__heading-large',
	bookCourse: '.lpg-book-course',
	course: '.discite__counter',
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

export function searchResults() {
	return browser.getText(selectors.searchResultsAmount)
}

export function search(searchTerm: string) {
	browser.url(config.BASE_URL + '/search')
	browser.waitForExist(selectors.searchBox, 1000)
	browser.setValue(selectors.searchBox, '')
	browser.setValue(selectors.searchBox, searchTerm)
	browser.click(selectors.searchButton)
	browser.waitForVisible(selectors.termSearched)
}
