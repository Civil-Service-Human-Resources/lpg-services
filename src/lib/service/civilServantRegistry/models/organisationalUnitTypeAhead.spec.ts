import { expect } from 'chai'

import { AgencyDomain, AgencyToken, OrganisationalUnit } from '../../../model'
import { OrganisationalUnitTypeAhead } from './organisationalUnitTypeAhead'

function createDomain(id: number, orgnisationName: string, domains: string[], parentId?: number) {
	const org = new OrganisationalUnit()
	org.name = orgnisationName
	if (domains.length > 0) {
		const agencyDomains = domains.map(d => {
			const a = new AgencyDomain()
			a.domain = d
			return a
		})
		const agencyToken = new AgencyToken()
		agencyToken.agencyDomains = agencyDomains
		org.agencyToken = agencyToken
	}
	if (parentId) {
		org.parentId = parentId
	}
	return org
}

describe('organisationUnitTypeAhead tests', () => {
	describe('getDomainFilteredList tests', () => {
		it('Should return the correct organisations when an agency domain is passed in', async () => {
			const domain = 'test.com'
			const parentOrg = createDomain(1, "A", [domain])
			const childOrg = createDomain(2, "B", [], 1)
			const childOrg2 = createDomain(3, "C", [], 1)
			const grandChildOrg = createDomain(4, "D", [], 2)
			const parentOrg2 = createDomain(5, "E", [])
			const orgs = [parentOrg, childOrg, childOrg2, grandChildOrg, parentOrg2]
			const typeahead = new OrganisationalUnitTypeAhead(orgs)
			const domains = await typeahead.getDomainFilteredList(domain)
			expect(domains.length === 4)
			expect(domain[0] === "A")
			expect(domain[1] === "B")
			expect(domain[2] === "C")
			expect(domain[3] === "D")
		})

		it('Should return all organisations when an agency domain is passed in but no token matches', async () => {
			const domain = 'test.com'
			const parentOrg = createDomain(1, "A", [domain])
			const childOrg = createDomain(2, "B", [], 1)
			const childOrg2 = createDomain(3, "C", [], 1)
			const grandChildOrg = createDomain(4, "D", [], 2)
			const parentOrg2 = createDomain(5, "E", [])
			const orgs = [parentOrg, childOrg, childOrg2, grandChildOrg, parentOrg2]
			const typeahead = new OrganisationalUnitTypeAhead(orgs)
			const domains = await typeahead.getDomainFilteredList(domain)
			expect(domains.length === 5)
		})
	})

	describe('sortByName tests', () => {
		it('Should return all organisations ordered by name', async () => {
			const parentOrg2 = createDomain(5, "E", [])
			const childOrg = createDomain(2, "B", [], 1)
			const grandChildOrg = createDomain(4, "D", [], 2)
			const childOrg2 = createDomain(3, "C", [], 1)
			const parentOrg = createDomain(1, "A", [])
			const orgs = [parentOrg, childOrg, childOrg2, grandChildOrg, parentOrg2]
			const typeahead = new OrganisationalUnitTypeAhead(orgs)
			const list = await typeahead.sortByName()
			expect(list[0].name === "A")
			expect(list[1].name === "B")
			expect(list[2].name === "C")
			expect(list[3].name === "D")
			expect(list[4].name === "E")
		})
	})
})
