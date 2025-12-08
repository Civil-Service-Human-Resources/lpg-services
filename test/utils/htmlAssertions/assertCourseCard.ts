import {JSDOM} from 'jsdom'
import {assertHtml, classAssertion, HTML, HtmlAssertion, TextContentAsserter} from '../htmlUtils'

export interface CourseCardAssertion {
	expTitle: {
		text: string
		href: string
	}
	properties: {
		type: string
		duration: string
		cost?: string
		statusBadge?: string
	}
	moduleCount: number
	expDescription: string
	dueBy?: string
	cta: {
		primary: {
			href: string
			text: string
		}
		secondary?: {
			text: string
			href?: string
		}
	}
	eventModule?: {
		title: {
			text: string
			href: string
		}
		status: string
		type: string
		dates: string[]
		cta?: {
			text: string
			href: string
		}
	}
}

export const assertCourseCard = (html: HTML, expValue: CourseCardAssertion) => {
	const assertions: HtmlAssertion[] = [
		classAssertion(['lpg-course-link'], {
			attributes: {
				href: expValue.expTitle.href,
			},
			content: new TextContentAsserter(expValue.expTitle.text),
		}),
		classAssertion(['lpg-course-type'], {
			content: new TextContentAsserter(expValue.properties.type),
		}),
		classAssertion(['lpg-course-duration'], {
			content: new TextContentAsserter(expValue.properties.duration),
		}),
		classAssertion(['discite__desc'], {
			content: new TextContentAsserter(expValue.expDescription),
		}),
		classAssertion(['discite__action-link--main'], {
			content: new TextContentAsserter(expValue.cta.primary.text),
			attributes: {
				href: expValue.cta.primary.href,
			},
		}),
	]
	let expModuleCountContent = null
	if (expValue.moduleCount > 1) {
		expModuleCountContent = {content: new TextContentAsserter(`This course has ${expValue.moduleCount} modules`)}
	}
	assertions.push(classAssertion(['discite__counter'], expModuleCountContent))
	if (expValue.properties.statusBadge) {
		assertions.push(
			classAssertion(['badge', 'badge--discite'], {
				content: new TextContentAsserter(expValue.properties.statusBadge),
			})
		)
	}
	if (expValue.properties.cost) {
		assertions.push(
			classAssertion(['lpg-course-cost'], {
				content: new TextContentAsserter(expValue.properties.cost),
			})
		)
	}
	if (expValue.dueBy) {
		assertions.push(
			classAssertion(['lpg-course-dueBy'], {
				content: new TextContentAsserter(`Due by: ${expValue.dueBy}`),
			})
		)
	}
	if (expValue.cta.secondary) {
		assertions.push(
			classAssertion(['discite__action-link--main:nth-of-type(2)'], {
				content: new TextContentAsserter(expValue.cta.secondary.text),
				attributes: {
					href: expValue.cta.secondary.href!,
				},
			})
		)
	}
	if (expValue.eventModule) {
		const eventModuleHtml = html.getElementsByClassName('discite__item--event')[0]
		const eventModuleAssertions = [
			classAssertion(['govuk-link'], {
				content: new TextContentAsserter(expValue.eventModule.title.text),
				attributes: {
					href: expValue.eventModule.title.href,
				},
			}),
			classAssertion(['lpg-course-type'], {
				content: new TextContentAsserter(expValue.eventModule.type),
			}),
			classAssertion(['badge', 'badge--discite', 'badge--info'], {
				content: new TextContentAsserter(expValue.eventModule.status),
			}),
		]
		for (let i = 0; i < expValue.eventModule.dates.length; i++) {
			eventModuleAssertions.push({
				querySelector: `li.discite__property-item:nth-of-type(${i + 1})`,
				expected: {
					content: new TextContentAsserter(expValue.eventModule.dates[i]),
				},
			})
		}
		assertHtml(eventModuleHtml, eventModuleAssertions)
	}
	assertHtml(html, assertions)
}
export const assertCourseCards = (html: string, expValues: CourseCardAssertion[]) => {
	const page = new JSDOM(html).window.document
	const cardHtmls = page.getElementsByClassName('discite__item')
	for (let i = 0; i < expValues.length; i++) {
		assertCourseCard(cardHtmls[i], expValues[i])
	}
}
