import {JSDOM} from 'jsdom'
import {assertHtml, classAssertion, HtmlAssertion, TextContentAsserter} from '../htmlUtils'

export interface BannerAssertion {
	title: string
	message: string
	actions?: {
		text: string
		href: string
	}[]
}

export const assertBanner = (html: string, expectedBanner: BannerAssertion) => {
	const assertions: HtmlAssertion[] = [
		classAssertion(['banner__heading-large'], {
			content: new TextContentAsserter(expectedBanner.title),
		}),
		{
			querySelector: 'p.no-margin > strong',
			expected: {
				content: new TextContentAsserter(expectedBanner.message),
			},
		},
	]
	if (expectedBanner.actions !== undefined) {
		for (let i = 0; i < expectedBanner.actions.length; i++) {
			const expectedAction = expectedBanner.actions[i]
			assertions.push(
				classAssertion([`banner__action:nth-of-type(${i + 1})`], {
					content: new TextContentAsserter(expectedAction.text),
					attributes: {
						href: expectedAction.href,
					},
				})
			)
		}
	}
	const doc = new JSDOM(html).window.document
	const bannerHtml = doc.getElementsByClassName('banner')[0]
	assertHtml(bannerHtml, assertions)
}
