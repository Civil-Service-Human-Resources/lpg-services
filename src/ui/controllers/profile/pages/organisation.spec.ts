import {expect} from 'chai'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import * as csrsService from '../../../../lib/service/civilServantRegistry/csrsService'
import * as cslService from '../../../../lib/service/cslService/cslService'
import {OrganisationalUnitTypeAhead} from '../../../../lib/service/civilServantRegistry/models/organisationalUnitTypeAhead'
import {FormattedOrganisation} from '../../../../lib/service/cslService/models/csrs/formattedOrganisation'
import * as template from '../../../../lib/ui/template'
import {PageBehaviour} from './common'
import * as common from './common'
import {selectOrganisationsMiddleware} from './organisation'

describe('Organisation middleware tests', () => {
	const organisationList = [new FormattedOrganisation(1, 'Org 1'), new FormattedOrganisation(2, 'Org 2')]
	const behaviour: PageBehaviour = {
		templateName: 'organisation',
		userSetup: true,
	}

	const run = async (userOrganisationId: number | undefined, organisation: number | undefined) => {
		const mockRequest = mockReq({
			body: {
				organisation,
			},
			user: {
				organisationalUnit: userOrganisationId ? {id: userOrganisationId} : undefined,
				isUnrestrictedOrgUser: () => {
					return false
				},
				getDomain: () => {
					return 'domain.com'
				},
				getOtherOrganisationIds: () => {
					return []
				},
			},
		})
		const mockResponse = mockRes()
		const mw = selectOrganisationsMiddleware(behaviour)
		await mw(mockRequest, mockResponse)
		return {mockRequest, mockResponse}
	}

	const sandbox = sinon.createSandbox()
	let patchStub: any
	let organisationTypeaheadStub
	let generateRedirectStub: any
	let renderStub: any
	beforeEach(() => {
		organisationTypeaheadStub = sandbox.createStubInstance(OrganisationalUnitTypeAhead)
		organisationTypeaheadStub.getFilteredListForUser.returns(organisationList)
		sandbox.stub(cslService, 'getOrganisationTypeaheadForUser').resolves(organisationList)
		patchStub = sandbox.stub(csrsService, 'patchCivilServantOrganisationUnit').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
		renderStub = sandbox.stub(template, 'render')
	})
	afterEach(() => {
		sandbox.restore()
	})
	it('Should update and redirect if there are no errors', async () => {
		await run(undefined, 1)
		expect(patchStub.calledOnce).to.eq(true)
		expect(generateRedirectStub.calledOnce).to.eq(true)
	})
	it("Should just redirect if the user's current organisation is selected", async () => {
		await run(1, 1)
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(true)
	})
	it('Should render the page with errors if there are errors', async () => {
		await run(undefined, undefined)
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(false)
		expect(renderStub.calledOnce).to.eq(true)
	})
})
