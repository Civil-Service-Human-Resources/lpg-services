import * as config from '../extension/config'

export const selectors: Record<string, string> = {
	addToPlan: '.lpg-add-from-search',
	addedNotification: '.banner__heading-large',
	applyFilter: 'button[class="button"]',
	blog: '#blog',
	bookCourse: '.discite__action--search > a',
	course: '.discite__counter',
	courseName: '.lpg-course-name',
	faceToFace: '',
	link: '#link',
	online: '#online',
	pageHeading: '.heading--page-heading',
	searchAction: '.result__action',
	searchBox: '.search-box__input',
	searchButton: '.search-box__submit',
	searchNextPage: '.pager__next',
	searchPagination: '.pager__controls',
	searchResultsAmount: '.lpg-search-amount',
	searchSummary: '.pager__summary',
	signoutButton: 'a[href="/sign-out"]',
	termSearched: '.lpg-search-query',
	video: '#video',
}

export function searchResults() {
	return browser.getText(selectors.searchResultsAmount)
}

export function search(searchTerm: string) {
	browser.url(config.BASE_URL + '/search')
	browser.waitForVisible(selectors.searchBox, 10000)
	browser.click(selectors.searchBox)
	browser.setValue(selectors.searchBox, '')
	browser.setValue(selectors.searchBox, searchTerm)
	browser.keys(['Enter'])
	browser.waitForVisible(selectors.termSearched)
}

export function filter(appFilter: string) {
	browser.click(appFilter)
	browser.click(selectors.applyFilter)
}
