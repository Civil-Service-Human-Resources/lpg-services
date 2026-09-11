import {within} from '@testing-library/dom'
import {expect} from 'chai'

export interface ExpLink {
	expHref: string
	expText: string
}

export function assertBreadcrumbs(html: HTMLElement, expLinks: ExpLink[]) {
	const breadcrumbs = within(html).getByLabelText('Breadcrumb')
	expLinks.forEach(l => {
		const link = within(breadcrumbs).getByRole('link', {name: l.expText})
		expect(link.getAttribute('href')).to.eql(l.expHref)
	})
}
