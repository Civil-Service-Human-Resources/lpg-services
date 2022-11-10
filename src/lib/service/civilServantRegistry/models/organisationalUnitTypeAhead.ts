import { OrganisationalUnit } from "../../../model";

export class OrganisationalUnitTypeAhead {

    constructor(public typeahead: OrganisationalUnit[]) { }

    sortByName() {
        const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
        this.typeahead.sort((a, b) => { return collator.compare(a.name, b.name)})
        return this.typeahead
    }

    getAsTree(): OrganisationalUnit[] {
        const map: Map<number, number> = new Map()
        const roots: OrganisationalUnit[] = []

        for (let i = 0; i < this.typeahead.length; i++) {
            map.set(this.typeahead[i].id, i)
            this.typeahead[i].children = []
        }

        for (let i = 0; i < this.typeahead.length; i++) {
            const org = this.typeahead[i]
            if (org.parentId != null) {
                this.typeahead[map.get(org.parentId)!].children.push(org)
            } else {
                roots.push(org)
            }
        }

        return roots
    }

    private getAllChildrenFromParent(parent: OrganisationalUnit, children: OrganisationalUnit[] = []) {
        parent.children.forEach(c => {
            children.push(c)
            children.push(...this.getAllChildrenFromParent(c, children))
        })
        return children
    }

    getDomainFilteredList(domain: string) {
        const filteredOrgs: OrganisationalUnit[] = []
        const tree = this.getAsTree()
        let domainOrg

        for (let i = 0; i < tree.length; i++) {
            const element = tree[i]
            if (element.agencyToken &&
                element.agencyToken.agencyDomains.map(a => a.domain).includes(domain)) {
                    domainOrg = element
                    break
            }
        }

        if (domainOrg) {
            filteredOrgs.push(...[domainOrg, ...this.getAllChildrenFromParent(domainOrg)])
            return filteredOrgs
        }

        return this.typeahead
    }
}