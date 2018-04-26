import * as config from 'extension/config'
import * as puppeteer from 'puppeteer'
import * as Page from 'puppeteer/lib/Page'

export interface PrivateBrowser extends puppeteer.Browser {
	_connection: any
	_ignoreHTTPSErrors: any
	_screenshotTaskQueue: any
}

declare var browser: PrivateBrowser

const sessions: Record<string, Session> = {}

export async function checkHidden(selector: string, page: puppeteer.Page) {
	return page.evaluate(sel => {
		const e = document.querySelector(sel)
		const style = window.getComputedStyle(e)
		return style.display
	}, selector)
}

export async function checkElementIsPresent(
	selector: string,
	page: puppeteer.Page
): Promise<boolean> {
	return page.evaluate(sel => {
		const e = document.querySelector(sel)
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

export async function getAllText(
	selector: string,
	page: puppeteer.Page
): Promise<string> {
	return await page.$$eval(selector, nodes => {
		const res = []
		for (const el of nodes) {
			res.push(el.innerHTML.trim())
		}
		return res
	})
}
export async function getText(
	selector: string,
	page: puppeteer.Page
): Promise<boolean> {
	return page.evaluate(sel => {
		const e = document.querySelector(sel)
		if (!e) {
			return false
		}
		return e.innerText
	}, selector)
}

export async function returnElementAttribute(
	selector: string,
	attri: string,
	page: puppeteer.Page
): Promise<string> {
	return page.$eval(
		selector,
		(element, attr) => element.getAttribute(attr),
		attri
	)
}

export async function getSession(name?: string) {
	if (config.PROFILE === 'local') {
		return browser
	}
	if (name && sessions[name]) {
		return sessions[name]
	}
	const {browserContextId} = await browser._connection.send(
		'Target.createBrowserContext'
	)
	const {targetId} = await browser._connection.send('Target.createTarget', {
		browserContextId,
		url: 'about:blank',
	})
	const client = await browser._connection.createSession(targetId)
	const session = new Session(browserContextId, client)
	if (name) {
		sessions[name] = session
	}
	return session
}

export function xpath(locator: string) {
	const elems = document.evaluate(
		locator,
		document.body,
		null,
		XPathResult.ORDERED_NODE_ITERATOR_TYPE,
		null
	)
	const results = []
	let next = elems.iterateNext()
	while (next) {
		results.push(next)
		next = elems.iterateNext()
	}
	return results
}

export class Session {
	constructor(private browserContextId: any, private client: any) {}

	async newPage() {
		const page = await Page.create(
			this.client,
			browser._ignoreHTTPSErrors,
			browser._screenshotTaskQueue
		)
		page.close = async () => {
			await browser._connection.send('Target.disposeBrowserContext', {
				browserContextId: this.browserContextId,
			})
		}
		return page
	}
}
