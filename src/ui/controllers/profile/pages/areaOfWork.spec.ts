import {expect} from 'chai'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import {AreaOfWork} from '../../../../lib/registry'
import {AreasOfWork} from '../../../../lib/service/civilServantRegistry/areaOfWork/areasOfWork'
import * as csrsService from '../../../../lib/service/civilServantRegistry/csrsService'
import * as template from '../../../../lib/ui/template'
import {selectAreaOfWorkMiddleware} from './areaOfWork'
import {PageBehaviour} from './common'
import * as common from './common'

describe('Area of work middleware tests', () => {
	const childAow = new AreaOfWork(4, 'aow4')
	const parentAow = new AreaOfWork(3, 'aow3')
	parentAow.children = [childAow]
	const areasOfWorkList = [new AreaOfWork(1, 'aow1'), new AreaOfWork(2, 'aow2'), parentAow]
	const areasOfWork = new AreasOfWork(areasOfWorkList, areasOfWorkList)
	const behaviour: PageBehaviour = {
		templateName: 'aow',
		userSetup: true,
	}

	const run = async (userAreaOfWorkId: number | undefined, areaOfWorkId: string | undefined) => {
		const mockRequest = mockReq({
			body: {
				'primary-area-of-work': areaOfWorkId,
			},
			user: {
				areaOfWork: userAreaOfWorkId ? {id: userAreaOfWorkId} : undefined,
			},
		})
		const mockResponse = mockRes()
		const mw = selectAreaOfWorkMiddleware(behaviour)
		await mw(mockRequest, mockResponse)
		return {mockRequest, mockResponse}
	}

	const sandbox = sinon.createSandbox()
	let patchStub: any
	let generateRedirectStub: any
	let renderStub: any
	beforeEach(() => {
		sandbox.stub(csrsService, 'getAreasOfWork').resolves(areasOfWork)
		patchStub = sandbox.stub(csrsService, 'patchCivilServantProfession').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
		renderStub = sandbox.stub(template, 'render')
	})
	afterEach(() => {
		sandbox.restore()
	})
	it('Should update and redirect if there are no errors', async () => {
		await run(undefined, '1')
		expect(patchStub.calledOnce).to.eq(true)
		expect(generateRedirectStub.calledOnce).to.eq(true)
	})
	it("Should just redirect if the user's current aow is selected", async () => {
		await run(1, '1')
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(true)
	})
	it('Should just render the selection page for child aows', async () => {
		await run(1, '3')
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(false)
		expect(renderStub.calledOnce).to.eq(true)
	})
	it('Should render the page with errors if there are errors', async () => {
		await run(undefined, undefined)
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(false)
		expect(renderStub.calledOnce).to.eq(true)
	})
})
