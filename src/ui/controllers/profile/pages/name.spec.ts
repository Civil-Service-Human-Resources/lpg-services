import {expect} from 'chai'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import * as csrsService from '../../../../lib/service/civilServantRegistry/csrsService'
import * as template from '../../../../lib/ui/template'
import {PageBehaviour} from './common'
import * as common from './common'
import {confirmNameMiddleware} from './name'

describe('Given name middleware tests', () => {
	const setupBehaviour: PageBehaviour = {
		templateName: 'name',
		userSetup: false,
	}
	const run = async (userGivenName: string | undefined, name: string | undefined) => {
		const mockRequest = mockReq({
			body: {
				'given-name': name,
			},
			user: {
				givenName: userGivenName,
			},
		})
		const mockResponse = mockRes()
		const mw = confirmNameMiddleware(setupBehaviour)
		await mw(mockRequest, mockResponse)
		return {mockRequest, mockResponse}
	}

	const sandbox = sinon.createSandbox()
	let patchStub: any
	let generateRedirectStub: any
	let renderStub: any
	beforeEach(() => {
		patchStub = sandbox.stub(csrsService, 'patchCivilServantName').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
		renderStub = sandbox.stub(template, 'render')
	})
	afterEach(() => {
		sandbox.restore()
	})
	it('Should update and redirect if there are no errors', async () => {
		await run(undefined, 'Name')
		expect(patchStub.calledOnce).to.eq(true)
		expect(generateRedirectStub.calledOnce).to.eq(true)
	})
	it("Should just redirect if the user's current name is entered", async () => {
		await run('Name', 'Name')
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(true)
	})
	it('Should re-render the template if the user enters a blank name', async () => {
		await run('Name', '')
		expect(renderStub.called).to.eq(true)
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(false)
	})
})
