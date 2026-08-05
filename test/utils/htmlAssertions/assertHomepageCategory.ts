import {within} from '@testing-library/dom'
import {expect} from 'chai'

export interface CategoryAssertion {
	expTitle: string
	expDescription: string
	expUrl: string
}

export function assertCategory(cardElement: HTMLElement, expValue: CategoryAssertion) {
	const card = within(cardElement)
	const link = card.getByRole('link', {name: 'View subjects'})
	expect(link.getAttribute('href')).to.eql(expValue.expUrl)
	card.getByRole('heading', {name: expValue.expTitle})
	card.getByText(expValue.expDescription)
}

export function assertCategories(html: HTMLElement, expValues: CategoryAssertion[]) {
	const htmls = html.getElementsByClassName('category-card')
	for (let i = 0; i < expValues.length; i++) {
		assertCategory(htmls[i] as HTMLElement, expValues[i])
	}
}
