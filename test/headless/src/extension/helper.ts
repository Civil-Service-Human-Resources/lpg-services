import * as puppeteer from 'puppeteer'

export async function checkElementIsPresent(
	selector: string,
	page: puppeteer.Page
): Promise<boolean> {
	return page.evaluate(selector => {
		const e = document.querySelector(selector)
		if (!e) {
			return false
		}
		const style = window.getComputedStyle(e)
		return (
			style &&
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0'
		)
	}, selector)
}

export async function returnElementAttribute(
	selector: string,
	attri: string,
	page: puppeteer.Page
): Promise<string> {
	return page.$eval(
		selector,
		(element, attri) => element.getAttribute(attri),
		attri
	)
}
