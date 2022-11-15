import {expect} from 'chai'
import * as sinon from 'sinon'

import {OrganisationalUnit, User} from '../../model'
import * as csrsService from './csrsService'
import {OrganisationalUnitCache} from './organisationalUnit/organisationalUnitCache'
import {OrganisationalUnitTypeaheadCache} from './organisationalUnit/organisationalUnitTypeaheadCache'
import * as organisationalUnitClient from './organisationalUnit/organisationUnitClient'

function getOrg(orgName: string, id: number, parentId?: number) {
	const org = new OrganisationalUnit()
	org.name = orgName
	org.id = id
	if (parentId) {
		org.parentId = parentId
	}
	return org
}

describe('CsrsService tests', () => {
	const orgUnitCache = sinon.createStubInstance(OrganisationalUnitCache)
	const orgTypeaheadCache = sinon.createStubInstance(OrganisationalUnitTypeaheadCache)
	const organisationalUnitClientStub = sinon.stub(organisationalUnitClient)
	const user = sinon.createStubInstance(User)

	beforeEach(() => {
		sinon.reset()
	})
	describe('Test getOrgHierarchy', () => {
		it('Should return the correct hierarchy when all orgs exist in the cache', async () => {
			const grandparent = getOrg('Grandparent', 1)
			const child = getOrg('Child', 3, 2)
			const parent = getOrg('Parent', 2, 1)

			orgUnitCache.get.withArgs(1).resolves(grandparent)
			orgUnitCache.get.withArgs(2).resolves(parent)
			orgUnitCache.get.withArgs(3).resolves(child)

			csrsService.setCaches(orgUnitCache as any, orgTypeaheadCache as any)
			const hierarchy = await csrsService.getOrgHierarchy(3, user)
			expect(hierarchy.map(o => o.name)).to.eql(['Child', 'Parent', 'Grandparent'])
		})

		it('Should return the correct hierarchy when no orgs exist in the cache', async () => {
			const grandparent = getOrg('Grandparent', 1)
			const child = getOrg('Child', 3, 2)
			const parent = getOrg('Parent', 2, 1)
			parent.parent = grandparent
			child.parent = parent

			orgUnitCache.get.withArgs(3).resolves(undefined)
			organisationalUnitClientStub.getOrganisationalUnit
				.withArgs(3, {includeParents: true}, user)
				.resolves(child)

			csrsService.setCaches(orgUnitCache as any, orgTypeaheadCache as any)
			const hierarchy = await csrsService.getOrgHierarchy(3, user)
			expect(hierarchy.map(o => o.name)).to.eql(['Child', 'Parent', 'Grandparent'])
		})
		it('Should return the correct hierarchy when there are mixed orgs in the cache', async () => {
			const grandparent = getOrg('Grandparent', 1)
			const child = getOrg('Child', 3, 2)
			const parent = getOrg('Parent', 2, 1)
			parent.parent = grandparent

			orgUnitCache.get.withArgs(3).resolves(child)
			organisationalUnitClientStub.getOrganisationalUnit
				.withArgs(2, {includeFormattedName: true, includeParents: true}, user)
				.resolves(child)

			csrsService.setCaches(orgUnitCache as any, orgTypeaheadCache as any)
			const hierarchy = await csrsService.getOrgHierarchy(3, user)
			expect(hierarchy.map(o => o.name)).to.eql(['Child', 'Parent', 'Grandparent'])
		})
	})
})
