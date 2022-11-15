import { Type } from 'class-transformer'

import { OrganisationalUnit } from '../../../model'

export class OrganisationalUnitTypeAhead {
	static createAndSort(typeahead: OrganisationalUnit[]) {
		const typeaheadObject = new OrganisationalUnitTypeAhead(typeahead)
		typeaheadObject.resetFormattedNameAndSort()
		return typeaheadObject
	}

	@Type(() => OrganisationalUnit)
	public typeahead: OrganisationalUnit[]

	constructor(typeahead: OrganisationalUnit[]) {
		this.typeahead = typeahead
	}

	/**
	 * Create the typeahead from an organisationalUnit list.
	 * Calculate and append the formattedName, and sort by formattedName
	 */
	resetFormattedNameAndSort() {
		const orgMap: Map<number, OrganisationalUnit> = new Map()
		this.typeahead.forEach(o => {
			o.formattedName = ''
			orgMap.set(o.id, o)
		})
		for (const org of this.typeahead) {
			org.formattedName = this.getFormattedName(orgMap, org.id)
		}
		this.sort()
	}

	sort() {
		const collator = new Intl.Collator('en', {numeric: true, sensitivity: 'base'})
		this.typeahead.sort((a, b) => collator.compare(a.formattedName, b.formattedName))
		return this.typeahead
	}

	getDomainFilteredList(domain: string) {
		const filteredOrgs: OrganisationalUnit[] = []
		let domainOrgFound = false

		for (const org of this.typeahead) {
			if (!domainOrgFound && org.agencyToken && org.agencyToken.agencyDomains.map(a => a.domain).includes(domain)) {
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

	private getFormattedName(orgMap: Map<number, OrganisationalUnit>, orgId: number) {
		const org = orgMap.get(orgId)!
		if (!org.formattedName) {
			let formattedName = org.formatNameWithAbbrev()
			if (org.parentId) {
				const parentFormattedName = this.getFormattedName(orgMap, org.parentId)
				formattedName = `${parentFormattedName} | ${formattedName}`
			}
			org.formattedName = formattedName
			orgMap.set(org.id, org)
		}
		return org.formattedName
	}
}
