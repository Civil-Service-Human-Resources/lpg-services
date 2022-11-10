import {OrganisationalUnit} from '../../../model'

export class OrganisationalUnitTypeAhead {
	constructor(public typeahead: OrganisationalUnit[]) {}

	sortByName() {
		const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'})
		this.typeahead.sort((a, b) => collator.compare(a.name, b.name))
		return this.typeahead
	}

	getAsTree(): OrganisationalUnit[] {
		const map: Map<number, number> = new Map()
		const roots: OrganisationalUnit[] = []

		for (let i = 0; i < this.typeahead.length; i++) {
			map.set(this.typeahead[i].id, i)
			this.typeahead[i].children = []
		}

		for (const org of this.typeahead) {
			if (org.parentId != null) {
				this.typeahead[map.get(org.parentId)!].children.push(org)
			} else {
				roots.push(org)
			}
		}

		return roots
	}

	getDomainFilteredList(domain: string) {
		const filteredOrgs: OrganisationalUnit[] = []
		let domainOrgFound = false

		for (let i = 0; i < this.typeahead.length; i++) {
			const org = this.typeahead[i]
			if (!domainOrgFound &&
				org.agencyToken &&
				org.agencyToken.agencyDomains.map(a => a.domain).includes(domain)) {
				domainOrgFound = true
			}
			if (domainOrgFound && org.parentId) {
				filteredOrgs.push(org)
			}
		}

		if (filteredOrgs) {
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
