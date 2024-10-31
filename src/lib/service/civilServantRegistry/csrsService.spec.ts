import {expect} from 'chai'
import {ProfileCache} from 'lib/service/civilServantRegistry/civilServant/profileCache'
import {AnonymousCache} from 'lib/utils/anonymousCache'
import * as sinon from 'sinon'

import {AgencyToken, OrganisationalUnit, User} from '../../model'
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
	let orgUnitCache: sinon.SinonStubbedInstance<OrganisationalUnitCache>
	let csrsProfileCache: sinon.SinonStubbedInstance<ProfileCache>
	let orgTypeaheadCache: sinon.SinonStubbedInstance<OrganisationalUnitTypeaheadCache>
	let gradeCache: sinon.SinonStubbedInstance<AnonymousCache<any>>
	let areaOfWorkCache: sinon.SinonStubbedInstance<AnonymousCache<any>>
	let interestCache: sinon.SinonStubbedInstance<AnonymousCache<any>>
	let organisationalUnitClientStub: sinon.SinonStubbedInstance<typeof organisationalUnitClient>
	let user: sinon.SinonStubbedInstance<User>

	beforeEach(() => {
		sinon.restore()
		orgUnitCache = sinon.createStubInstance(OrganisationalUnitCache)
		orgTypeaheadCache = sinon.createStubInstance(OrganisationalUnitTypeaheadCache)
		csrsProfileCache = sinon.createStubInstance(ProfileCache)
		gradeCache = sinon.createStubInstance(AnonymousCache)
		areaOfWorkCache = sinon.createStubInstance(AnonymousCache)
		interestCache = sinon.createStubInstance(AnonymousCache)
		organisationalUnitClientStub = sinon.stub(organisationalUnitClient)
		user = sinon.createStubInstance(User)
		csrsService.setCaches(orgUnitCache as any, orgTypeaheadCache as any, csrsProfileCache as any,
			gradeCache as any, areaOfWorkCache as any, interestCache as any)
	})

	describe('getOrganisation tests', () => {
		it('should get organisationalUnit with cache hit', async () => {
			const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			organisationalUnit.id = 1
			orgUnitCache.get.withArgs(1).resolves(organisationalUnit)
			const result = await csrsService.getOrganisation(user, 1)

			expect(result).to.eql(organisationalUnit)
		})

		it('should get organisationalUnit and parent with cache hit', async () => {
			const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			organisationalUnit.id = 1
			organisationalUnit.parentId = 2

			const parentOrganisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			parentOrganisationalUnit.id = 2

			orgUnitCache.get.withArgs(1).resolves(organisationalUnit)
			orgUnitCache.get.withArgs(2).resolves(parentOrganisationalUnit)
			const result = await csrsService.getOrganisation(user, 1, true)

			expect(result).to.eql(organisationalUnit)
			expect(result.parent!).to.eql(parentOrganisationalUnit)
		})

		it('should get organisationalUnit and agency token with cache hit', async () => {
			const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			organisationalUnit.id = 1

			const agencyToken = new AgencyToken()
			agencyToken.uid = 'agencyUID'
			organisationalUnit.agencyToken = agencyToken

			orgUnitCache.get.withArgs(1).resolves(organisationalUnit)
			const result = await csrsService.getOrganisation(user, 1, true)

			expect(result.id).to.eql(1)
			expect(result.agencyToken!.uid).to.eql('agencyUID')
		})

		it('should get organisationalUnit and set the cache on cache miss', async () => {
			const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			organisationalUnit.id = 1

			organisationalUnitClientStub.getOrganisationalUnit.withArgs(1, {includeParents: false}).resolves(organisationalUnit)

			orgUnitCache.get.withArgs(1).resolves(undefined)
			const result = await csrsService.getOrganisation(user, 1)

			expect(orgUnitCache.setMultiple).to.be.calledOnceWith([organisationalUnit])
			expect(result.id).to.eql(1)
		})

		it('should get organisationalUnit and set the cache on cache miss, as well as set parents', async () => {
			const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			organisationalUnit.id = 1

			const parentOrganisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			parentOrganisationalUnit.id = 2

			organisationalUnit.parentId = 2
			organisationalUnit.parent = parentOrganisationalUnit

			organisationalUnitClientStub.getOrganisationalUnit.withArgs(1, {includeParents: true}).resolves(organisationalUnit)

			orgUnitCache.get.withArgs(1).resolves(undefined)
			const result = await csrsService.getOrganisation(user, 1, true)

			expect(orgUnitCache.setMultiple).to.be.calledWith([organisationalUnit, parentOrganisationalUnit])
			expect(result.id).to.eql(1)
			expect(result.parent!.id).to.eql(2)
			expect(result.parent).to.eql(parentOrganisationalUnit)
		})
	})

	describe('Test getOrgHierarchy', () => {
		it('Should return the correct hierarchy when all orgs exist in the cache', async () => {
			const grandparent = getOrg('Grandparent', 1)
			const child = getOrg('Child', 3, 2)
			const parent = getOrg('Parent', 2, 1)

			orgUnitCache.get.withArgs(1).resolves(grandparent)
			orgUnitCache.get.withArgs(2).resolves(parent)
			orgUnitCache.get.withArgs(3).resolves(child)

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
				.withArgs(2, {includeParents: true}, user)
				.resolves(parent)

			const hierarchy = await csrsService.getOrgHierarchy(3, user)
			expect(hierarchy.map(o => o.name)).to.eql(['Child', 'Parent', 'Grandparent'])
		})
	})
})
