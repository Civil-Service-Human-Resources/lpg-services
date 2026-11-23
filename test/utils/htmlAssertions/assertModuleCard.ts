import {within} from '@testing-library/dom'
import {expect} from 'chai'

export interface ModuleCardCta {
	type: 'button' | 'link' | 'text'
	text: string
	href?: string
	screenReaderText?: string
	openInNewTab?: boolean
}

export interface ModuleCardAssertion {
	expTitle: string
	expDescription: string
	expOptional: boolean
	cta: ModuleCardCta
	details?: {
		expType: string
		expDuration?: string
		expState?: string | null
		expCost?: string | null
	}
}

export const assertModuleCards = (html: HTMLElement, expValues: ModuleCardAssertion[]) => {
	const cardHtmls = html.getElementsByClassName('discite__item u-clearfix discite__item--module')
	for (let i = 0; i < expValues.length; i++) {
		assertModuleCard(cardHtmls[i] as HTMLElement, expValues[i])
	}
}

export const assertModuleCard = (elem: HTMLElement, expValue: ModuleCardAssertion) => {
	const card = within(elem)

	card.getByRole('heading', {name: expValue.expTitle})
	card.getByText(expValue.expDescription)

	if (expValue.expOptional) {
		card.getByText('This module is optional')
	}

	const details = expValue.details
	if (details) {
		card.getByText(details.expType)

		if (details.expCost !== undefined) {
			if (details.expCost !== null) {
				card.getByText(`${details.expCost}`)
			} else {
				expect(elem.querySelector('span.lpg-course-cost')).to.eql(null)
			}
		}

		if (details.expDuration) {
			card.getByText(details.expDuration)
		}

		if (details.expState !== undefined) {
			if (details.expState === null) {
				expect(elem.querySelector('div.discite__status')).to.eql(null)
			} else {
				card.getByText(details.expState)
			}
		}
	}

	const {cta} = expValue
	if (cta.type === 'button' || cta.type === 'link') {
		const ctaLink = card.getByRole(cta.type, {name: cta.text})
		if (cta.type === 'link') {
			expect(ctaLink.getAttribute('href')).to.eql(cta.href)

			if (cta.openInNewTab) {
				expect(ctaLink.getAttribute('target')).to.eql('_blank')
			}
		}
	} else {
		card.getByText(cta.text)
	}
}
