import * as chai from 'chai'
import {expect} from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import {mockReq, mockRes} from 'sinon-express-mock'
import {areaOfWorkPage} from './areaOfWork'
import * as common from './common'
import {interestsPage} from './interests'
import {lineManagerPage} from './lineManager'

chai.use(sinonChai)

describe("Common profile utils tests", () => {
	const sandbox = sinon.createSandbox()
	afterEach(() => {
		sandbox.restore()
	})
	describe("generateRedirect", () => {
		let profileSession: common.ProfileSession
		let profileSessionObjectServiceStub: any
		beforeEach(() => {
			profileSessionObjectServiceStub = sandbox.stub(common.profileSessionObjectService)
		})
		const run = (profileSessionObject: common.ProfileSession, pageSpec: common.ProfilePageSpecification) => {
			profileSessionObjectServiceStub.fetchObjectFromSession.returns(profileSessionObject)
			const mockRequest = mockReq({
				session: {
					save: (cb: any) => {
						cb()
					},
				},
			})
			const mockResponse = mockRes()
			common.generateRedirect(pageSpec, mockRequest, mockResponse)
			return {mockRequest, mockResponse}
		}
		it("Should generate a redirect to the next page in the journey", () => {
			profileSession = new common.ProfileSession(true)
			const result = run(profileSession, areaOfWorkPage)
			expect(result.mockResponse.redirect).to.have.been.calledOnceWith('/profile/other-areas-of-work')
		})
		it("Should generate a redirect to the original URL", () => {
			profileSession = new common.ProfileSession(true, '/home')
			const result = run(profileSession, lineManagerPage)
			/* tslint:disable-next-line:no-unused-expression */
			expect(profileSessionObjectServiceStub.deleteObjectFromSession).to.have.been.calledOnce
			expect(result.mockResponse.redirect).to.have.been.calledOnceWith('/home')
		})
		it("Should generate a redirect to the profile page", () => {
			profileSession = new common.ProfileSession(false)
			const result = run(profileSession, lineManagerPage)
			expect(result.mockResponse.redirect).to.have.been.calledOnceWith('/profile')
		})
	})
	describe("generateProfilePageBehaviour", () => {
		it("Should return the setup template when the user doesn't have a required profile property set", () => {
			const user: any = {
				areaOfWork: undefined,
			}
			const profileSession = new common.ProfileSession(true)
			const result = common.generateProfilePageBehaviour(areaOfWorkPage, user, profileSession)
			expect(result.templateName).to.eql('/profile/primaryAreaOfWork')
			expect(result.userSetup).to.eql(true)
		})
		it("Should return the setup template when the user is setting up their profile for the first time", () => {
			const user: any = {
				interests: undefined,
			}
			const profileSession = new common.ProfileSession(true)
			const result = common.generateProfilePageBehaviour(interestsPage, user, profileSession)
			expect(result.templateName).to.eql('/profile/interests')
			expect(result.userSetup).to.eql(true)
		})
		it("Should return the edit template when the user is editing their profile", () => {
			const user: any = {
				interests: ['1'],
			}
			const profileSession = new common.ProfileSession(false)
			const result = common.generateProfilePageBehaviour(interestsPage, user, profileSession)
			expect(result.templateName).to.eql('/profile/edit/interests')
			expect(result.userSetup).to.eql(false)
		})
	})
})
