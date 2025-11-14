import {Type} from 'class-transformer'
import {OrganisationalUnit} from '../../../../model'

export class OrganisationalUnits {
	@Type(() => OrganisationalUnit)
	public organisationalUnits: OrganisationalUnit[]

	constructor(organisationalUnits: OrganisationalUnit[]) {
		this.organisationalUnits = organisationalUnits
	}

	getHierarchy(rootId: number) {
		const map: Map<number, OrganisationalUnit> = new Map<number, OrganisationalUnit>(this.organisationalUnits.map(o => {
			return [o.id, o]
		}))
		let currentId: number | undefined = rootId
		const hierarchy: OrganisationalUnit[] = []
		while (currentId) {
			const organisationalUnit = map.get(rootId)
			if (organisationalUnit) {
				hierarchy.push(organisationalUnit)
				currentId = organisationalUnit.parentId
			}
		}
		return hierarchy
	}
}
