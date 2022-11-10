import {OrganisationalUnit} from '../../../model'

export class OrganisationalUnitTypeAhead {
	constructor(public typeahead: OrganisationalUnit[]) {}

	sortByName() {
		const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'})
		this.typeahead.sort((a, b) => collator.compare(a.name, b.name))
		return this.typeahead
	}

	getDomainFilteredList(domain: string) {
		const filteredOrgs: OrganisationalUnit[] = []
		let domainOrgFound = false

		for (const org of this.typeahead) {
			if (!domainOrgFound &&
				org.agencyToken &&
				org.agencyToken.agencyDomains.map(a => a.domain).includes(domain)) {
					filteredOrgs.push(org)
					domainOrgFound = true
			}
			if (domainOrgFound && org.parentId) {
				filteredOrgs.push(org)
			}
		}

		if (filteredOrgs.length > 0) {
			return filteredOrgs
		}

		return this.typeahead
	}

	private getAllChildrenFromParent(parent: OrganisationalUnit, children: OrganisationalUnit[] = []) {
		parent.children.forEach(c => {
			children.push(c)
			children.push(...this.getAllChildrenFromParent(c, children))
		})
		return children
	}
}
