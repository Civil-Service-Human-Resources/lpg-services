import {expect} from 'chai'
import {OrganisationalUnit} from 'lib/model'
import * as csrsService from 'lib/service/civilServantRegistry/csrsService'
import {OrganisationalUnitTypeAhead} from 'lib/service/civilServantRegistry/models/organisationalUnitTypeAhead'
import * as template from 'lib/ui/template'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import {PageBehaviour} from './common'
import * as common from './common'
import {selectOrganisationsMiddleware} from './organisation'

describe("Organisation middleware tests", () => {
	const org1 = new OrganisationalUnit()
	org1.id = 1
	const org2 = new OrganisationalUnit()
	org2.id = 2
	const organisationList = [org1, org2]
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
		sandbox.stub(csrsService, 'getAllOrganisationUnits').resolves(organisationTypeaheadStub)
		patchStub = sandbox.stub(csrsService, 'patchCivilServantOrganisationUnit').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
		renderStub = sandbox.stub(template, 'render')
	})
	afterEach(() => {
		sandbox.restore()
	})
	it("Should update and redirect if there are no errors", async () => {
		await run(undefined, 1)
		expect(patchStub.calledOnce).to.eq(true)
		expect(generateRedirectStub.calledOnce).to.eq(true)
	})
	it("Should just redirect if the user's current organisation is selected", async () => {
		await run(1, 1)
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(true)
	})
	it("Should render the page with errors if there are errors", async () => {
		await run(undefined, undefined)
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(false)
		expect(renderStub.calledOnce).to.eq(true)
	})
})
