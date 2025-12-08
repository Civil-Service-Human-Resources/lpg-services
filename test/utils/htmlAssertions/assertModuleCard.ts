import {JSDOM} from 'jsdom'
import {
	assertHtml,
	classAssertion,
	HtmlAssertion,
	MultipleContentAsserter,
	TextContainsAsserter,
	TextContentAsserter,
} from '../htmlUtils'

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
