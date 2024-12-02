import {expect} from 'chai'
import {JSDOM} from 'jsdom'

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

interface TagContentAsserter {
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
		exp(elem.textContent!.trim(), `Expected tag '${elem.outerHTML}' to equal text '${this.expText}'`).eql(this.expText)
	}
}

export class TextContainsAsserter implements TagContentAsserter {
	constructor(private expText: string) {}
	assert(elem: Element, exp: Chai.ExpectStatic) {
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

export const getCTALinkButtonAssertion = (expHref: string, expText: string): HtmlAssertion => {
	return {
		querySelector: `.button`,
		expected: {
			content: new TextContentAsserter(expText),
			attributes: {
				href: expHref,
			},
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

export const assertHtml = (rawHtml: string, assertions: HtmlAssertion[]) => {
	const page = new JSDOM(rawHtml).window.document
	assertions.forEach(a => assertDoc(page, a))
}

export const assertDocMultiple = (doc: Document | Element, assertions: HtmlAssertion[], exp?: Chai.ExpectStatic) => {
	exp = exp ? exp : expect
	assertions.forEach(a => {
		assertDoc(doc, a, exp)
	})
}

export const assertDoc = (doc: Document | Element, assertion: HtmlAssertion, exp?: Chai.ExpectStatic) => {
	exp = exp ? exp : expect
	const elem = doc.querySelectorAll(assertion.querySelector)[0]
	const expected = assertion.expected
	if (expected === null) {
		exp(elem || null).null
	} else {
		exp(elem || null, `Expected element with selector '${assertion.querySelector}' to not be null`).not.null
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

export interface CourseDetailsAssertion {
	expType: string
	expDuration: string | null
	expAreasOfWork: string[] | null
	expLocation: string | null
	expGrades: string[] | null
	expCost: string | null
}

export const getDetailsRowAssertion = (expHeading: string, expText: string): HtmlAssertion[] => {
	return [
		{
			querySelector: 'th.lpg-related-items__th',
			expected: {
				content: new TextContentAsserter(expHeading),
			},
		},
		{
			querySelector: 'td.lpg-related-items__td',
			expected: {
				content: new TextContentAsserter(expText),
			},
		},
	]
}

export const assertCourseDetails = (html: string, expValues: CourseDetailsAssertion) => {
	const doc = new JSDOM(html).window.document
	const assertions: [HtmlAssertion[]] = [getDetailsRowAssertion('Course type', expValues.expType)]
	if (expValues.expDuration) {
		assertions.push(getDetailsRowAssertion('Duration', expValues.expDuration))
	}
	if (expValues.expAreasOfWork) {
		assertions.push(getDetailsRowAssertion('Key area', expValues.expAreasOfWork.join(', ')))
	}
	if (expValues.expLocation) {
		assertions.push(getDetailsRowAssertion('Location', expValues.expLocation))
	}
	if (expValues.expGrades) {
		assertions.push(getDetailsRowAssertion('Level', expValues.expGrades.join(', ')))
	}
	if (expValues.expCost) {
		assertions.push(getDetailsRowAssertion('Cost', expValues.expCost))
	}
	const elems = doc.querySelectorAll('tr')
	for (let i = 0; i < elems.length; i++) {
		const elem = elems[i]
		const assertion = assertions[i]
		assertDocMultiple(elem, assertion)
	}
}

export interface ModuleCardAssertion {
	expTitle: string
	expDescription: string
	expOptional: boolean
	ctaElem: HtmlAssertion
	details?: {
		expType: string
		expDuration?: string
		expState?: string | null
		expCost?: string | null
	}
}

export const getLinkCTAAssertion = (expLaunchLink: string, expModuleTitle: string): HtmlAssertion => {
	const assertion = getCTAAssertion(expLaunchLink, 'Start', expModuleTitle)
	assertion.expected!.attributes!.target = '_blank'
	return assertion
}

export const getCTAAssertion = (
	expLaunchLink: string,
	expModuleActionText: string,
	expModuleTitle: string
): HtmlAssertion => {
	return {
		querySelector: '.discite__action-link--main',
		expected: {
			content: new MultipleContentAsserter([
				new TextContainsAsserter(expModuleActionText),
				new TextContainsAsserter(expModuleTitle),
			]),
			attributes: {
				href: expLaunchLink,
			},
		},
	}
}

export const assertModuleCard = (html: string, expValues: ModuleCardAssertion[]) => {
	const page = new JSDOM(html).window.document
	const cardHtmls = page.getElementsByClassName('discite__item u-clearfix discite__item--module')
	for (let i = 0; i < expValues.length; i++) {
		const expValue = expValues[i]
		const assertions: HtmlAssertion[] = [
			classAssertion(['heading', 'bold-small', 'heading--text'], {
				content: new TextContentAsserter(expValue.expTitle),
			}),
			classAssertion(['discite__description'], {
				content: new TextContentAsserter(expValue.expDescription),
			}),
		]
		if (expValue.expOptional) {
			assertions.push(
				classAssertion(['discite__optional'], {
					content: new TextContentAsserter('This module is optional'),
				})
			)
		}
		assertions.push(expValue.ctaElem)
		const details = expValue.details
		if (details) {
			assertions.push({
				querySelector: 'span.lpg-course-type',
				expected: {content: new TextContentAsserter(details.expType)},
			})
			if (details.expCost !== undefined) {
				if (details.expCost !== null) {
					assertions.push({
						querySelector: 'span.lpg-course-cost',
						expected: {content: new TextContentAsserter(`£${details.expCost}`)},
					})
				} else {
					assertions.push({querySelector: 'span.lpg-course-cost', expected: null})
				}
			}
			if (details.expDuration) {
				assertions.push({
					querySelector: 'span.lpg-course-duration',
					expected: {content: new TextContentAsserter(details.expDuration)},
				})
			}
			if (details.expState !== undefined) {
				if (details.expState === null) {
					assertions.push({querySelector: 'div.discite__status', expected: null})
				} else {
					assertions.push({
						querySelector: 'span.badge.badge--info',
						expected: {content: new TextContentAsserter(details.expState)},
					})
				}
			}
			assertHtml(cardHtmls[i].outerHTML, assertions)
		}
	}
}
