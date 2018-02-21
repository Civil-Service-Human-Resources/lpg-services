import * as puppeteer from 'puppeteer'
import * as Page from 'puppeteer/lib/Page'

interface PrivateBrowser {
	_connection: any
	_ignoreHTTPSErrors: any
	_screenshotTaskQueue: any
}

declare var browser: PrivateBrowser

const sessions: Record<string, Session> = {}

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

export async function getText(
	selector: string,
	page: puppeteer.Page
): Promise<boolean> {
	return page.evaluate(selector => {
		const e = document.querySelector(selector)
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
		(element, attri) => element.getAttribute(attri),
		attri
	)
}

export async function getSession(name?: string) {
	if (name && sessions[name]) {
		return sessions[name]
	}
	const {browserContextId} = await browser._connection.send(
		'Target.createBrowserContext'
	)
	const {targetId} = await browser._connection.send('Target.createTarget', {
		url: 'about:blank',
		browserContextId,
	})
	const client = await browser._connection.createSession(targetId)
	const session = new Session(browserContextId, client)
	if (name) {
		sessions[name] = session
	}
	return session
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
