import {expect} from 'chai'
import {JSDOM} from 'jsdom'

export type HTML = Document | Element

export interface HtmlAssertion {
	querySelector: string
	expected: ExpectedHtmlValues | null
}

export interface ExpectedHtmlValues {
	content: TagContentAsserter
	classes?: string[]
	attributes?: {[prop: string]: string}
}

export const idAssertion = (id: string, expected: ExpectedHtmlValues | null): HtmlAssertion => {
	return {
		querySelector: `#${id}`,
		expected,
	}
}

export const classAssertion = (classes: string[], expected: ExpectedHtmlValues | null): HtmlAssertion => {
	const querySelector = classes.map(c => `.${c}`).join('')
	return {
		querySelector,
		expected,
	}
}

export interface TagContentAsserter {
	assert(elem: Element, exp: Chai.ExpectStatic): void
}

export class MultipleContentAsserter implements TagContentAsserter {
	constructor(private asserters: TagContentAsserter[]) {}
	assert(elem: Element, exp: Chai.ExpectStatic) {
		this.asserters.forEach(a => a.assert(elem, exp))
	}
}

export class TextContentAsserter implements TagContentAsserter {
	constructor(private expText: string) {}
	assert(elem: Element, exp: Chai.ExpectStatic) {
		console.log(`Expecting tag '${elem.outerHTML}' to equal text '${this.expText}'`)
		exp(elem.textContent!.trim(), `Expected tag '${elem.outerHTML}' to equal text '${this.expText}'`).eql(this.expText)
	}
}

export class TextContainsAsserter implements TagContentAsserter {
	constructor(private expText: string) {}
	assert(elem: Element, exp: Chai.ExpectStatic) {
		console.log(`Expecting tag '${elem.outerHTML}' to contain text '${this.expText}'`)
		exp(elem.textContent!.trim(), `Expected tag '${elem.outerHTML}' to contain text '${this.expText}'`).contains(
			this.expText
		)
	}
}

export const assertH1 = (expectedText: string): HtmlAssertion => {
	return {
		querySelector: 'h1',
		expected: {
			content: new TextContentAsserter(expectedText),
		},
	}
}

export const titleAssertion = (expValue: string): HtmlAssertion => {
	expValue = `${expValue} - Civil Service Learning`
	return {
		querySelector: 'title',
		expected: {
			content: new TextContentAsserter(expValue),
		},
	}
}

export const getBackLinkAssertion = (expHref: string, expText: string): HtmlAssertion => {
	return {
		querySelector: `.link-back`,
		expected: {
			content: new TextContentAsserter(expText),
			attributes: {
				href: expHref,
			},
		},
	}
}

export const getAssertNotificationBanner = (expTitle: string, expContent: string): HtmlAssertion[] => {
	return [
		idAssertion('govuk-notification-banner-title', {content: new TextContentAsserter(expTitle)}),
		idAssertion('govuk-notification-banner-content', {content: new TextContentAsserter(expContent)}),
	]
}

export const assertHtml = (html: string | HTML, assertions: HtmlAssertion[]) => {
	const page = typeof html === 'string' ? new JSDOM(html).window.document : html
	assertions.forEach(a => {
		assertDoc(page, a)
	})
}

export const assertDocMultiple = (doc: HTML, assertions: HtmlAssertion[], exp?: Chai.ExpectStatic) => {
	exp = exp ? exp : expect
	assertions.forEach(a => {
		assertDoc(doc, a, exp)
	})
}

export const assertDoc = (doc: HTML, assertion: HtmlAssertion, exp?: Chai.ExpectStatic) => {
	exp = exp ? exp : expect
	exp(doc, 'HTML document is undefined').not.eql(undefined)
	const elem = doc.querySelectorAll(assertion.querySelector)[0]
	const expected = assertion.expected
	if (expected === null) {
		exp(elem || null).eql(null)
	} else {
		exp(elem || null, `Expected element with selector '${assertion.querySelector}' to not be null`).not.eql(null)
		expected.content.assert(elem, exp)
		const expClasses = expected.classes || []
		expClasses.forEach(c =>
			exp(elem.classList).contain(c, `Expected class list to contain class '${c}' (tag: '${elem.outerHTML}')`)
		)
		const attr = expected.attributes || {}
		Object.keys(attr).forEach(key => {
			const expVal = attr[key]
			exp(elem.getAttribute(key)).eql(
				expVal,
				`Expected HTML attribute '${key}' to equal '${expVal}' (tag: '${elem.outerHTML}')`
			)
		})
	}
}
