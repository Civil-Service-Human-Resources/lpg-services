export const selectors: Record<string, string> = {
	areasOfWork: '.lpg-areas-of-work',
	changeAreasOfWork: 'a[href="/profile/areas-of-work"]',
	changeDepartment: 'a[href="/profile/department"]',
	changeGivenName: 'a[href="/profile/given-name"]',
	changeGrade: 'a[href="/profile/grade"]',
	commercialAreaOfWork: '#commercial',
	continueButton: 'button[type="submit"]',
	currentAreaOfWork: '.lpg-areas-of-work > ul > li',
	department: '.lpg-department',
	departmentFieldError: '.lpg-department-error',
	digitalAreaOfWork: '#digital',
	editDepartmentField: '#department',
	editNameField: '#given-name',
	emailAddress: '.lpg-email-address',
	emailAddressReadOnly: '.lpg-email-address-read-only',
	feedbackLink: '.lpg-feedback-link',
	givenName: '.lpg-given-name',
	givenNameFieldError: '.lpg-name-error',
	grade: '.lpg-grade',
	gradeFieldError: '.lpg-grade-error',
	incompleteProfileError: '.lpg-incomplete-profile',
	profileForm: '.form-control',
	profilePageButton: '#proposition-links > li > a',
	profileUpdatedBanner: '.banner--confirmation',
	signoutButton: 'a[href="/sign-out"]',
}

export function editProfileInfo(
	profileField: string,
	selector: string,
	updateValue: string
) {
	browser.click(profileField)
	browser.waitForVisible(selector)
	browser.setValue(selector, '')
	browser.setValue(selector, updateValue)
	browser.click(selectors.continueButton)
	browser.waitForVisible(selectors.profileUpdatedBanner)
}

export function editAreaOfWork(uncheck: string, checked: string[]) {
	browser.click(selectors.changeAreasOfWork)
	browser.waitForVisible(selectors.commercialAreaOfWork)
	browser.click(uncheck)
	for (const ele of checked) {
		browser.click(ele)
	}
	browser.click(selectors.continueButton)
	browser.waitForVisible(selectors.profileUpdatedBanner)
}

export function getProfs() {
	return browser.elements(selectors.currentAreaOfWork).then(ele => {
		const res = []
		for (const el of ele.value) {
			res.push(
				browser
					.element(el.ELEMENT)
					.getAttribute('innerHTML')
					.trim()
			)
		}
		return res
	})
	// return browser.$$(selectors.currentAreaOfWork).value.map(nodes => {
	// 	console.log('list of professions>>>>>>>>', nodes)
	// const res = []
	// for (const el of nodes) {
	// 	res.push(el.innerHTML.trim())
	// }
	// return res
}

export function returnUserProfileDetails() {
	const result = browser.$$('.form-control').value
	console.log('WHAT AM I?>???.//', result)
	const profile: Record<string, string> = {}
	for (const val of result) {
		console.log('ELEMENT>>>>>>>>', val)
		// const attrName = val.getAttribute('name')
		// if (attrName) {
		// 	profile[attrName] = val.getAttribute('value') || ''
		// }
	}
	return profile
}

// export async function returnUserProfileDetails(page: puppeteer.Page) {
// 	return page.$$eval('.form-control', values => {
// 		const profile: Record<string, string> = {}
// 		for (const val of values) {
// 			const attrName = val.getAttribute('name')
// 			if (attrName) {
// 				profile[attrName] = val.getAttribute('value') || ''
// 			}
// 		}
// 		return profile
// 	})
// }

export function arrMod(str: string[]) {
	return str.map(e => {
		return '#' + e.toLowerCase()
	})
}
