import {Type} from 'class-transformer'

import {OrganisationalUnit} from '../../../model'

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
			o.children = []
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

	getAsTree(): OrganisationalUnit[] {
		const idMapping: {
			[key: number]: number
		} = this.typeahead.reduce(
			(
				acc: {
					[key: number]: number
				},
				el,
				i
			) => {
				acc[el.id] = i
				return acc
			},
			{}
		)
		const roots: OrganisationalUnit[] = []

		this.typeahead.map(o => {
			if (o.parentId) {
				this.typeahead[idMapping[o.parentId]].children.push(o)
			} else {
				roots.push(o)
			}
		})
		return roots
	}

	getDomainFilteredList(domain: string, agencyToken?: string): OrganisationalUnit[] {
		if (agencyToken !== undefined) {
			const tree = this.getAsTree()
			const agencyOrg = this.getAgencyOrganisationWithDomain(domain, tree)
			if (agencyOrg !== undefined) {
				return agencyOrg.extractAllOrgs()
			}
		}
		return this.typeahead.filter(o => o.doesDomainExist(domain))
	}

	private getAgencyOrganisationWithDomain(domain: string, tree: OrganisationalUnit[]): OrganisationalUnit | undefined {
		for (const org of tree) {
			if (org.doesDomainExistInToken(domain)) {
				return org
			}
			if (org.children) {
				const organisation = this.getAgencyOrganisationWithDomain(domain, org.children)
				if (organisation) {
					return organisation
				}
			}
		}
		return undefined
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
