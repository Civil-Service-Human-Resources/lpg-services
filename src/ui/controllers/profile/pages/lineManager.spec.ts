import {expect} from 'chai'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import {ResourceNotFoundError} from '../../../../lib/exception/ResourceNotFoundError'
import * as csrsService from '../../../../lib/service/civilServantRegistry/csrsService'
import * as template from '../../../../lib/ui/template'
import {PageBehaviour} from './common'
import * as common from './common'
import {confirmLineManagerMiddleware} from './lineManager'

describe('Line manager middleware tests', () => {
	const setupBehaviour: PageBehaviour = {
		templateName: 'lineManager',
		userSetup: true,
	}
	const editBehaviour: PageBehaviour = {
		templateName: 'lineManager',
		userSetup: false,
	}
	const userEmail = 'user@test.com'

	const run = async (
		userLinemanagerEmail: string | undefined,
		lineManagerEmail: string | undefined,
		confirmLineManagerEmail: string | undefined,
		pageBehaviour: PageBehaviour = setupBehaviour
	) => {
		const mockRequest = mockReq({
			body: {
				confirm: confirmLineManagerEmail,
				email: lineManagerEmail,
			},
			user: {
				lineManager: userLinemanagerEmail
					? {
							email: userLinemanagerEmail,
						}
					: undefined,
				userName: userEmail,
			},
		})
		const mockResponse = mockRes()
		const mw = confirmLineManagerMiddleware(pageBehaviour)
		await mw(mockRequest, mockResponse)
		return {mockRequest, mockResponse}
	}

	const sandbox = sinon.createSandbox()
	let patchStub: any
	let generateRedirectStub: any
	let renderStub: any
	beforeEach(() => {
		patchStub = sandbox.stub(csrsService, 'patchCivilServantLineManager').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
		renderStub = sandbox.stub(template, 'render')
	})
	afterEach(() => {
		sandbox.restore()
	})
	describe('User setup tests', () => {
		it('Should update and redirect if there are no errors', async () => {
			await run(undefined, 'example@example.com', 'example@example.com')
			expect(patchStub.calledOnce).to.eq(true)
			expect(generateRedirectStub.calledOnce).to.eq(true)
		})
	})
	describe('User edit tests', () => {
		const currentLm = 'example.com'
		describe('Errors', () => {
			it('Should re-render the page if no line manager is entered', async () => {
				await run(currentLm, '', '', editBehaviour)
				expect(renderStub.calledOnce).to.eq(true)
				expect(patchStub.calledOnce).to.eq(false)
				expect(generateRedirectStub.calledOnce).to.eq(false)
			})
			it("Should re-render the page if line manager boxes don't match", async () => {
				await run(currentLm, 'test@test.com', 'test2@test.com', editBehaviour)
				expect(renderStub.calledOnce).to.eq(true)
				expect(patchStub.calledOnce).to.eq(false)
				expect(generateRedirectStub.calledOnce).to.eq(false)
			})
			it('Should re-render the page if an invalid email is entered', async () => {
				await run(currentLm, 'testtest.com', 'testtest.com', editBehaviour)
				expect(renderStub.calledOnce).to.eq(true)
				expect(patchStub.calledOnce).to.eq(false)
				expect(generateRedirectStub.calledOnce).to.eq(false)
			})
			it("Should re-render the page if the user's own email is entered", async () => {
				await run(currentLm, userEmail, userEmail, editBehaviour)
				expect(renderStub.calledOnce).to.eq(true)
				expect(patchStub.calledOnce).to.eq(false)
				expect(generateRedirectStub.calledOnce).to.eq(false)
			})
			it('Should re-render the page if the line manager does not have a profile', async () => {
				patchStub.throws(new ResourceNotFoundError('Not Found'))
				await run(currentLm, 'test@test.com', 'test@test.com', editBehaviour)
				expect(renderStub.calledOnce).to.eq(true)
				expect(patchStub.calledOnce).to.eq(true)
				expect(generateRedirectStub.calledOnce).to.eq(false)
			})
		})
		it('Should redirect if the line manager is valid', async () => {
			await run(currentLm, 'test@test.com', 'test@test.com', editBehaviour)
			expect(patchStub.calledOnce).to.eq(true)
			expect(generateRedirectStub.calledOnce).to.eq(true)
		})
	})
})
