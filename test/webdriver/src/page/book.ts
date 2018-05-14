export const selectors: Record<string, string> = {
	accessReqs: '#accessibility-req-',
	accessibilityTab: '.lpg-accessibility',
	activeTab: '.nav-tabs > ul > li.active > button',
	beforeTab: '.lpg-before-book',
	bookButton: 'a[class="button"]',
	bookingDate: '.lpg-booking-date',
	cancelButton: 'input[class="button"]',
	cancelCourse:
		'.lpg-other-courses > div > div.discite__action.discite__action--home > a',
	cancelPage: '.cancel__list',
	cancelValidation: '#error-summary-heading-example-1',
	canceltcs: '#cancel-tc',
	changeDate: '.lpg-change-date',
	changePayment: '.lpg-change-payment',
	changeReqs: '.lpg-change-reqs',
	chooseDate: '.lpg-date',
	confirmAccessReqs: '.lpg-access-reqs',
	confirmPrice: '.lpg-confirm-price',
	confirmedBooking: '.lpg-booking-confirmed',
	continueButton: 'input[value="Continue"]',
	dateBreadcrum: '.group > li:nth-child(3) > a',
	dateRow: 'lpg-date-row',
	dateTable: '.lpg-date-table',
	department: '#department',
	deptContinue: 'button[class="button"]',
	fap: '#financial-approver',
	keyInfo: '.govuk-related-items ',
	paymentMethod: '.lpg-payment-method',
	price: '.lpg-price',
	purchaseOrder: '#purchase-order',
	refundTab: '.lpg-refund',
	registeredStatus:
		'.lpg-other-courses > div > div > ul > li > .discite__status > span',
	searchBook: '.lpg-book-course',
	selectDate: '.lpg-select-date',
	selectedDate: '.lpg-selected-date',
	termsTab: '.lpg-terms',
	validationError: '#error-summary-heading',
}

export function createAccessList() {
	const checked = []
	browser.click(selectors.accessReqs + '1')
	checked.push(getSelectedAccessReqs(selectors.accessReqs + 1))
	browser.click(selectors.accessReqs + '3')
	checked.push(getSelectedAccessReqs(selectors.accessReqs + 3))
	return checked
}

export function getSelectedAccessReqs(reqs: string) {
	const formatted = reqs.slice(1)
	return browser.element('label[for="' + formatted + '"]').getText()
}

export function returnActive(active: string) {
	return browser.element(selectors.activeTab).getAttribute('innerHTML')
}
