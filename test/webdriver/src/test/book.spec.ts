import * as config from '../extension/config'
import {createAccessList, returnActive, selectors} from '../page/book'
import loginPage from '../page/login'
// import {genUserEmail} from '../page/globals'

// const TEST_USERNAME = genUserEmail()

describe('Bookable face to face courses funtionality', () => {
	beforeAll(done => {
		browser.url(config.URL)
		loginPage.testAccountLogin()
	})

	it('Should display the book option for a bookable course on search page', () => {
		browser.url(config.BASE_URL + '/search?q=Agile+project+management')
		const bookButton = browser.element(selectors.searchBook)
		expect(bookButton.isVisible()).toBe(true)
	})

	it('Should display the key information on the course overview', () => {
		browser.url(config.BASE_URL + '/courses/f_ezQdqDSwqAW7HKrI3nDQ')
		expect(browser.isVisible(selectors.keyInfo)).toBe(true)
	})

	it('Should take you to date selection when clicking the book this course button', () => {
		browser.click(selectors.bookButton)
		expect(browser.isVisible(selectors.dateTable)).toBe(true)
	})

	it('Should fire validation when no date is selected', () => {
		browser.click(selectors.continueButton)
		expect(browser.isVisible(selectors.validationError)).toBe(true)
	})

	it('Should set selected date button to selected state', () => {
		browser.click(selectors.selectDate)
		expect(browser.element(selectors.selectedDate).isVisible()).toBe(true)
	})

	it('Should display the before you book information', () => {
		expect(browser.element(selectors.beforeTab).isVisible()).toBe(true)
		browser.click(selectors.beforeTab)
		const active = returnActive('Before you book')
		expect(active).toContain('Before you book')
	})

	it('Should display the terms and conditions', () => {
		expect(browser.element(selectors.termsTab).isVisible()).toBe(true)
		browser.click(selectors.termsTab)
		const active = returnActive('Terms and Conditions')
		expect(active).toContain('Terms and Conditions')
	})

	it('Should display the refund policy', () => {
		expect(browser.element(selectors.refundTab).isVisible()).toBe(true)
		browser.click(selectors.refundTab)
		const active = returnActive('Refund policy')
		expect(active).toContain('Refund policy')
	})

	it('Should display the accessibility needs section', () => {
		expect(browser.element(selectors.accessibilityTab).isVisible()).toBe(true)
		browser.click(selectors.accessibilityTab)
		const active = returnActive('Accessibility')
		expect(active).toContain('Accessibility')
	})

	it('Should contain a list of accessibility needs with checkboxes', () => {
		let i
		for (i = 1; i <= 7; i++) {
			expect(browser.element(selectors.accessReqs + i).isExisting()).toBe(true)
		}
	})

	it('Should have PO option under payment for cabinet office', () => {
		browser.click(selectors.continueButton)
		const url = browser.getUrl()
		browser.url(config.BASE_URL + '/profile/department')
		browser.waitForExist(selectors.department)
		browser.setValue(selectors.department, 'Cabinet Office')
		browser.click(selectors.deptContinue)
		browser.url(url)
		expect(browser.isVisible(selectors.purchaseOrder)).toBe(true)
	})

	it('Should store the PO number and display on booking confirmation page', () => {
		browser.pause(5000)
		browser.setValue(selectors.purchaseOrder, 'PO332442')
		browser.click(selectors.continueButton)
		const paymentMethod = browser.element(selectors.paymentMethod).getText()
		expect(paymentMethod).toEqual('Purchase order')
	})

	xit('Should have FAP option under payment for HMRC', () => {
		const url = browser.getUrl()
		browser.url(config.BASE_URL + '/profile/department')
		browser.waitForExist(selectors.department)
		browser.setValue(selectors.department, 'HM Revenue & Customs')
		browser.click(selectors.deptContinue)
		browser.url(url)
		expect(browser.isVisible(selectors.fap)).toBe(true)
	})

	it('Should list correct date on booking confirmation page', () => {
		const confirmDate = browser.getText(selectors.bookingDate)
		browser.click(selectors.dateBreadcrum)
		const selectedDate = browser.element(selectors.chooseDate).getText()
		expect(selectedDate).toEqual(confirmDate)
	})

	it('Should list correct price on booking confirmation page', () => {
		const price = browser.element(selectors.price).getText()
		browser.click(selectors.continueButton)
		browser.click(selectors.continueButton)
		const confirmPrice = browser.element(selectors.confirmPrice).getText()
		expect(confirmPrice).toEqual(price)
	})

	it('Should list correct accessibility needs on booking confirmation page', () => {
		browser.click(selectors.dateBreadcrum)
		browser.click(selectors.accessibilityTab)
		const access = createAccessList()
		browser.click(selectors.continueButton)
		browser.click(selectors.continueButton)
		expect(browser.getText(selectors.confirmAccessReqs)).toEqual(access)
	})

	it('Clicking change on date section redirects user to date selection page with previous option selected', () => {
		const url = browser.getUrl()
		browser.click(selectors.changeDate)
		expect(browser.element(selectors.selectedDate).isVisible()).toBe(true)
		browser.url(url)
	})

	it('Clicking change on payment section redirects user to payment page with previous option selected', () => {
		const url = browser.getUrl()
		browser.click(selectors.changePayment)
		expect(browser.isVisible(selectors.purchaseOrder)).toBe(true)
		browser.url(url)
	})

	it('Clicking change on access needs redirects user to needs section page with previous options selected', () => {
		const url = browser.getUrl()
		browser.click(selectors.changeReqs)
		const active = returnActive('Accessibility')
		expect(active).toContain('Accessibility')
		browser.url(url)
	})

	it('Should display booking request page when clicking book', () => {
		browser.click(selectors.bookButton)
		expect(browser.isVisible(selectors.confirmedBooking)).toBe(true)
	})

	it('Should list course in other learning with status registered', () => {
		browser.url(config.BASE_URL + '/home')
		const registered = browser.getText(selectors.registeredStatus)
		expect(registered).toContain('Registered')
	})

	it('Should display cancel option on regiestered course', () => {
		expect(browser.isVisible(selectors.cancelCourse)).toBe(true)
	})

	it('Clicking cancel displays cancel confirmation page', () => {
		browser.click(selectors.cancelCourse)
		expect(browser.isVisible(selectors.cancelPage)).toBe(true)
	})

	it('Should fire validation when terms are not checked and cancel is clicked', () => {
		browser.click(selectors.cancelButton)
		expect(browser.element(selectors.cancelValidation).isVisible()).toBe(true)
	})

	it('Should cancel course when terms and agress and cancel is clicked', () => {
		browser.click(selectors.canceltcs)
		browser.click(selectors.cancelButton)
		expect(browser.getText('h1')).toEqual('Booking request cancelled')
	})
})
