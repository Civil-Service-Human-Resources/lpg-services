import {expect} from 'chai'
import {Grade} from 'lib/registry'
import * as csrsService from 'lib/service/civilServantRegistry/csrsService'
import {Grades} from 'lib/service/civilServantRegistry/grade/grades'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import {PageBehaviour} from './common'
import * as common from './common'
import {confirmGradeMiddleware} from './grade'

describe("Grade middleware tests", () => {
	const gradeList = [
		new Grade(1, 'G1', 'grade 1'),
		new Grade(2, 'G2', 'grade 2'),
	]
	const grades = new Grades(gradeList)
	const behaviour: PageBehaviour = {
		templateName: 'grade',
		userSetup: true,
	}

	const run = async (userGradeId: number | undefined, gradeId: string | undefined) => {
		const mockRequest = mockReq({
			body: {
				grade: gradeId,
			},
			user: {
				grade: userGradeId ? {id: userGradeId} : undefined,
			},
		})
		const mockResponse = mockRes()
		const mw = confirmGradeMiddleware(behaviour)
		await mw(mockRequest, mockResponse)
		return {mockRequest, mockResponse}
	}

	const sandbox = sinon.createSandbox()
	let patchStub: any
	let generateRedirectStub: any
	beforeEach(() => {
		sandbox.stub(csrsService, 'getGrades').resolves(grades)
		patchStub = sandbox.stub(csrsService, 'patchCivilServantGrade').resolves()
		generateRedirectStub = sandbox.stub(common, 'generateRedirect')
	})
	afterEach(() => {
		sandbox.restore()
	})
	it("Should update and redirect if there are no errors", async () => {
		await run(undefined, '1')
		expect(patchStub.calledOnce).to.eq(true)
		expect(generateRedirectStub.calledOnce).to.eq(true)
	})
	it("Should just redirect if the user's current grade is selected", async () => {
		await run(1, '1')
		expect(patchStub.called).to.eq(false)
		expect(generateRedirectStub.called).to.eq(true)
	})
})
