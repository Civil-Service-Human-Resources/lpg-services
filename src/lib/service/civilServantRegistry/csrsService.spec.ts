import {expect} from 'chai'
import * as sinon from 'sinon'
import {AnonymousCache} from '../../utils/anonymousCache'
import {GetOrganisationalUnitParams} from '../cslService/models/csrs/getOrganisationalUnitParams'
import {OrganisationalUnits} from '../cslService/models/csrs/organisationalUnits'
import {ProfileCache} from './civilServant/profileCache'

import {OrganisationalUnit, User} from '../../model'
import * as csrsService from './csrsService'
import {OrganisationalUnitCache} from './organisationalUnit/organisationalUnitCache'
import * as cslServiceClient from '../cslService/cslServiceClient'

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
	const sandbox = sinon.createSandbox()
	let orgUnitCache: sinon.SinonStubbedInstance<OrganisationalUnitCache>
	let csrsProfileCache: sinon.SinonStubbedInstance<ProfileCache>
	let gradeCache: sinon.SinonStubbedInstance<AnonymousCache<any>>
	let areaOfWorkCache: sinon.SinonStubbedInstance<AnonymousCache<any>>
	let interestCache: sinon.SinonStubbedInstance<AnonymousCache<any>>
	let cslServiceClientStub: sinon.SinonStubbedInstance<typeof cslServiceClient>
	let user: sinon.SinonStubbedInstance<User>

	beforeEach(() => {
		orgUnitCache = sandbox.createStubInstance(OrganisationalUnitCache)
		csrsProfileCache = sandbox.createStubInstance(ProfileCache)
		gradeCache = sandbox.createStubInstance(AnonymousCache)
		areaOfWorkCache = sandbox.createStubInstance(AnonymousCache)
		interestCache = sandbox.createStubInstance(AnonymousCache)
		cslServiceClientStub = sandbox.stub(cslServiceClient)
		user = sandbox.createStubInstance(User)
		csrsService.setCaches(
			orgUnitCache as any,
			csrsProfileCache as any,
			gradeCache as any,
			areaOfWorkCache as any,
			interestCache as any
		)
	})

	afterEach(() => {
		sandbox.restore()
	})

	describe('getOrganisation tests', () => {
		it('should get organisationalUnit with cache hit', async () => {
			const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			organisationalUnit.id = 1
			orgUnitCache.get.withArgs(1).resolves(organisationalUnit)
			const result = await csrsService.getOrganisation(user, 1)

			expect(result).to.eql(organisationalUnit)
		})

		it('should get organisationalUnit and set the cache on cache miss', async () => {
			const organisationalUnit: OrganisationalUnit = new OrganisationalUnit()
			organisationalUnit.id = 1

			cslServiceClientStub.getOrganisationalUnits
				.withArgs(new GetOrganisationalUnitParams([1], true), user)
				.resolves(new OrganisationalUnits([organisationalUnit]))

			orgUnitCache.get.withArgs(1).resolves(undefined)
			const result = await csrsService.getOrganisation(user, 1)

			expect(orgUnitCache.setObject).to.be.calledOnceWith(organisationalUnit)
			expect(result.id).to.eql(1)
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
			parent.parentId = grandparent.id
			child.parentId = parent.id

			orgUnitCache.get.withArgs(3).resolves(undefined)
			cslServiceClientStub.getOrganisationalUnits.withArgs(new GetOrganisationalUnitParams([3], true), user).resolves(new OrganisationalUnits([child, parent, grandparent]))

			const hierarchy = await csrsService.getOrgHierarchy(3, user)
			expect(hierarchy.map(o => o.name)).to.eql(['Child', 'Parent', 'Grandparent'])
		})
		it('Should return the correct hierarchy when there are mixed orgs in the cache', async () => {
			const grandparent = getOrg('Grandparent', 1)
			const child = getOrg('Child', 3, 2)
			const parent = getOrg('Parent', 2, 1)
			parent.parentId = grandparent.id

			orgUnitCache.get.withArgs(3).resolves(child)
			cslServiceClientStub.getOrganisationalUnits.withArgs(new GetOrganisationalUnitParams([2], true), user)
				.resolves(new OrganisationalUnits([parent, grandparent]))

			const hierarchy = await csrsService.getOrgHierarchy(3, user)
			expect(hierarchy.map(o => o.name)).to.eql(['Child', 'Parent', 'Grandparent'])
		})
	})
})
