import {within} from '@testing-library/dom'
import {expect} from 'chai'

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

export const assertLearningCard = (cardElement: HTMLElement, expValue: CourseCardAssertion) => {
	const card = within(cardElement)
	const titleLink = card.getByRole('link', {name: expValue.expTitle.text})
	expect(titleLink.getAttribute('href')).to.eql(expValue.expTitle.href)
	card.getByText(expValue.properties.type)
	card.getByText(expValue.properties.duration)
	card.getByText(expValue.expDescription)

	if (expValue.properties.cost) {
		card.getByText(expValue.properties.cost)
	}

	if (expValue.moduleCount > 1) {
		const expectedModuleText = `This course has ${expValue.moduleCount} modules`
		card.getByText(expectedModuleText)
	}

	const primaryCta = card.getByRole('link', {name: expValue.cta.primary.text})
	expect(primaryCta.getAttribute('href')).to.eql(expValue.cta.primary.href)

	if (expValue.cta.secondary) {
		if (expValue.cta.secondary.href) {
			const secondaryLink = card.getByRole('link', {name: expValue.cta.secondary.text})
			expect(secondaryLink.getAttribute('href')).to.equal(expValue.cta.secondary.href)
		} else {
			card.getByText(expValue.cta.secondary.text)
		}
	}
}

export const assertCourseCards = (html: HTMLElement, expValues: CourseCardAssertion[]) => {
	const cardHtmls = html.getElementsByClassName('discite__item')
	for (let i = 0; i < expValues.length; i++) {
		assertLearningCard(cardHtmls[i] as HTMLElement, expValues[i])
	}
}

export const assertLearningCards = (html: HTMLElement, expValues: CourseCardAssertion[]) => {
	const cardHtmls = html.getElementsByClassName('learning-card')
	for (let i = 0; i < expValues.length; i++) {
		assertLearningCard(cardHtmls[i] as HTMLElement, expValues[i])
	}
}
