import {expect} from 'chai'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import {Interest} from '../../../../lib/registry'
import * as csrsService from '../../../../lib/service/civilServantRegistry/csrsService'
import {Interests} from '../../../../lib/service/civilServantRegistry/interest/interests'
import {PageBehaviour} from './common'
import * as common from './common'
import {selectInterestsMiddleware} from './interests'

describe('Interest middleware tests', () => {
	const interestsList = [new Interest('interest 1', 1), new Interest('interest 2', 2)]
	const interests = new Interests(interestsList)
	const setupBehaviour: PageBehaviour = {
		templateName: 'interest',
		userSetup: true,
	}
	const editBehaviour: PageBehaviour = {
		templateName: 'interest',
		userSetup: false,
	}

	const run = async (
		userInterestIds: number[] | undefined,
		interestIds: string[] | undefined,
		pageBehaviour: PageBehaviour = setupBehaviour
	) => {
		const mockRequest = mockReq({
			body: {
				interests: interestIds,
			},
			user: {
				interests: userInterestIds
					? userInterestIds.map(i => {
							return {
								id: i,
							}
						})
					: undefined,
			},
		})
		const mockResponse = mockRes()
		const mw = selectInterestsMiddleware(pageBehaviour)
		await mw(mockRequest, mockResponse)
		return {mockRequest, mockResponse}
	}

	const sandbox = sinon.createSandbox()
	let patchStub: any
	let generateRedirectStub: any
	beforeEach(() => {
		sandbox.stub(csrsService, 'getInterests').resolves(interests)
		patchStub = sandbox.stub(csrsService, 'patchCivilServantInterests').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
	})
	afterEach(() => {
		sandbox.restore()
	})
	describe('User setup tests', () => {
		it('Should update and redirect if there are no errors', async () => {
			await run(undefined, ['1', '2'])
			expect(patchStub.calledOnce).to.eq(true)
			expect(generateRedirectStub.calledOnce).to.eq(true)
		})
	})
	describe('User edit tests', () => {
		it("Should just redirect if the user's current interests are selected", async () => {
			await run([2, 1], ['1', '2'], editBehaviour)
			expect(patchStub.called).to.eq(false)
			expect(generateRedirectStub.called).to.eq(true)
		})
		it('Should redirect if no interests are selected', async () => {
			await run([], [], editBehaviour)
			expect(patchStub.called).to.eq(false)
			expect(generateRedirectStub.called).to.eq(true)
		})
	})
})
