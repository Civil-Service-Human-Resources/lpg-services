import {expect} from 'chai'

import {AgencyToken, Domain, OrganisationalUnit} from '../../../model'
import {OrganisationalUnitTypeAhead} from './organisationalUnitTypeAhead'

function createOrg(
	id: number, orgnisationName: string, domains: string[], agencyDomains: string[],
	parentId: number | null, abbrev?: string) {
	const org = new OrganisationalUnit()
	org.name = orgnisationName
	org.id = id
	if (domains.length > 0) {
		org.domains = domains.map(d => {
			const a = new Domain()
			a.domain = d
			return a
		})
	}
	if (agencyDomains.length > 0) {
		const agencyDomainsObj = agencyDomains.map(d => {
			const a = new Domain()
			a.domain = d
			return a
		})
		const agencyToken = new AgencyToken()
		agencyToken.agencyDomains = agencyDomainsObj
		org.agencyToken = agencyToken
	}
	if (parentId) {
		org.parentId = parentId
	}
	if (abbrev) {
		org.abbreviation = abbrev
	}
	org.children = []
	return org
}

describe('organisationUnitTypeAhead tests', () => {
	describe('getDomainFilteredList tests', () => {
		it('Should return the correct organisations when an agency domain is passed in', async () => {
			const domain = 'test.com'
			const parentOrg = createOrg(1, "A", [], [domain], null)
			const childOrg = createOrg(2, "B", [], [], 1)
			const childOrg2 = createOrg(3, "C", [], [], 1)
			const grandChildOrg = createOrg(4, "D", [], [], 2)
			const parentOrg2 = createOrg(5, "E", [], [], null)
			const orgs = [parentOrg, childOrg, childOrg2, grandChildOrg, parentOrg2]
			const typeahead = OrganisationalUnitTypeAhead.createAndSort(orgs)
			const list = await typeahead.getDomainFilteredList(domain)
			expect(list.map(o => o.formattedName)).to.eql(["A", "A | B", "A | B | D", "A | C"])
		})

		it('Should return correct filtered organisations when a domain is passed in but no token matches', async () => {
			const domain = 'test.com'
			const parentOrg = createOrg(1, "A", ['other.com'], [], null)
			const childOrg = createOrg(2, "B", ['test.com'], [], 1)
			const childOrg2 = createOrg(3, "C", [], [], 1)
			const grandChildOrg = createOrg(4, "D", [], [], 2)
			const parentOrg2 = createOrg(5, "E", ['test.com'], [], null)
			const orgs = [parentOrg, childOrg, childOrg2, grandChildOrg, parentOrg2]
			const typeahead = OrganisationalUnitTypeAhead.createAndSort(orgs)
			const list = await typeahead.getDomainFilteredList(domain)
			expect(list.map(o => o.formattedName)).to.eql(["A | B", "E"])
		})
	})

	describe('addFormattedNameAndSort tests', () => {
		it('Should create a typeahead list sorted by formattedName', async () => {
			const grandparentOrg = createOrg(5, "E", [], [], null)
			const parentOrg = createOrg(2, "B", [], [], 1)
			const childOrg = createOrg(4, "D", [], [], 2)
			const parentOrg2 = createOrg(3, "C", [], [], 1)
			const grandparentOrg2 = createOrg(1, "A", [], [], null)
			const orgs = [grandparentOrg, childOrg, parentOrg, parentOrg2, grandparentOrg2]
			const typeahead = OrganisationalUnitTypeAhead.createAndSort(orgs)
			const list = typeahead.typeahead
			expect(list.map(o => o.formattedName)).to.eql([
				"A",
				"A | B",
				"A | B | D",
				"A | C",
				"E",
			])
		})

		it('Should create a typeahead list sorted by formattedName, including abbreviations', async () => {
			const grandparentOrg = createOrg(5, "Ministry of Defence", [], [], null, "MOD")
			const parentOrg = createOrg(2, "Government Business Services", [], [], 1, "GBS")
			const childOrg = createOrg(4, "Platforms and Services", [], [], 2, "PaSO")
			const parentOrg2 = createOrg(3, "Government Digital Services", [], [], 1, "GDS")
			const grandparentOrg2 = createOrg(1, "Cabinet Office", [], [], null, "CO")
			const orgs = [grandparentOrg, childOrg, parentOrg, parentOrg2, grandparentOrg2]
			const typeahead = OrganisationalUnitTypeAhead.createAndSort(orgs)
			const list = typeahead.typeahead
			expect(list.map(o => o.formattedName)).to.eql([
				"Cabinet Office (CO)",
				"Cabinet Office (CO) | Government Business Services (GBS)",
				"Cabinet Office (CO) | Government Business Services (GBS) | Platforms and Services (PaSO)",
				"Cabinet Office (CO) | Government Digital Services (GDS)",
				"Ministry of Defence (MOD)",
			])
		})
	})
})
