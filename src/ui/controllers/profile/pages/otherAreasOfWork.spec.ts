import {expect} from 'chai'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import {AreaOfWork} from '../../../../lib/registry'
import {AreasOfWork} from '../../../../lib/service/civilServantRegistry/areaOfWork/areasOfWork'
import * as csrsService from '../../../../lib/service/civilServantRegistry/csrsService'
import * as cslService from'../../../../lib/service/cslService/cslServiceClient'
import * as template from '../../../../lib/ui/template'
import {PageBehaviour} from './common'
import * as common from './common'
import {selectOtherAreasOfWorkMiddleware} from './otherAreasOfWork'

describe('Other areas of work middleware tests', () => {
	const areasOfWorkList = [new AreaOfWork(1, 'aow1'), new AreaOfWork(2, 'aow2'), new AreaOfWork(3, 'aow3')]
	const areasOfWork = new AreasOfWork(areasOfWorkList, areasOfWorkList)
	const behaviour: PageBehaviour = {
		templateName: 'aow',
		userSetup: true,
	}

	const run = async (userOtherAreaOfWorkIds: number[] | undefined, areaOfWorkIds: string[] | undefined) => {
		const mockRequest = mockReq({
			body: {
				'other-areas-of-work': areaOfWorkIds,
			},
			user: {
				otherAreasOfWork: userOtherAreaOfWorkIds ? userOtherAreaOfWorkIds.map(aow => ({id: aow})) : undefined,
			},
		})
		const mockResponse = mockRes()
		const mw = selectOtherAreasOfWorkMiddleware(behaviour)
		await mw(mockRequest, mockResponse)
		return {mockRequest, mockResponse}
	}

	const sandbox = sinon.createSandbox()
	let patchStub: any
	let generateRedirectStub: any
	let renderStub: any
	let completeProfileStub: any
	beforeEach(() => {
		behaviour.userSetup = true
		sandbox.stub(csrsService, 'getAreasOfWork').resolves(areasOfWork)
		patchStub = sandbox.stub(csrsService, 'patchCivilServantOtherAreasOfWork').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
		renderStub = sandbox.stub(template, 'render')
		completeProfileStub = sandbox.stub(cslService, 'completeProfile').resolves()
	})
	afterEach(() => {
		sandbox.restore()
	})
	it('Should update and redirect if there are no errors', async () => {
		await run(undefined, ['1', '2'])
		expect(completeProfileStub.calledOnce).to.eq(true)
		expect(patchStub.calledOnce).to.eq(true)
		expect(generateRedirectStub.calledOnce).to.eq(true)
	})
	it('Should not call completeProfile if the user is not setting up their profile for the ' +
		'first time', async () => {
		behaviour.userSetup = false
		await run(undefined, ['1', '2'])
		expect(completeProfileStub.called).to.eq(false)
		expect(patchStub.calledOnce).to.eq(true)
		expect(generateRedirectStub.calledOnce).to.eq(true)
	})
	it("Should just redirect if the user's current areas of work are selected", async () => {
		behaviour.userSetup = false
		await run([2, 1], ['1', '2'])
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(true)
	})
	it('Should re-render the page if no areas of work are selected', async () => {
		await run([1], [])
		expect(renderStub.calledOnce).to.eq(true)
		expect(patchStub.calledOnce).to.eq(false)
		expect(generateRedirectStub.calledOnce).to.eq(false)
	})
})
