import * as chai from 'chai'
import {expect} from 'chai'
import { plainToClass } from 'class-transformer'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import { mockReq, mockRes } from 'sinon-express-mock'

import { ResourceNotFoundError } from '../exception/ResourceNotFoundError'
import { OrganisationalUnit } from '../model'
import * as csrsService from '../service/civilServantRegistry/csrsService'
import { requiresDepartmentHierarchy } from './requiresDepartmentHierarchy'

chai.use(sinonChai)

describe('requiresDepartmentHierarchy tests', () => {

	let csrsServiceStub: sinon.SinonStubbedInstance<typeof csrsService>

	beforeEach(() => {
		sinon.restore()
		csrsServiceStub = sinon.stub(csrsService)
	})

	it('Should fetch the department hierarchy for a user and apply it to the response locals', async () => {
		const request = mockReq({
			originalUrl: '/suggestions-for-you',
			user: {
				departmentId: 123,
				givenName: 'Test User',
				organisationalUnit: {
					code: 'co',
					name: 'Cabinet Office',
					paymentMethods: [],
				},
			},
		})
		request.session!.save = callback => {
			callback(undefined)
		}

		const response = mockRes()
		const next = sinon.stub()
		csrsServiceStub.getOrgHierarchy.withArgs(123).resolves([
			plainToClass(OrganisationalUnit, {code: '123'}),
			plainToClass(OrganisationalUnit, {code: '456'}),
		])
		await requiresDepartmentHierarchy(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(next).to.have.been.calledOnce
		expect(response.locals.departmentHierarchyCodes).to.eql(['123', '456'])
	})

	it('Should redirect the user to the profile page if their organisation has been deleted', async () => {
		const request = mockReq({
			originalUrl: '/suggestions-for-you',
			session: {
				passport: {
					user: {},
				},
			},
			user: {
				departmentId: 123,
				givenName: 'Test User',
				organisationalUnit: {
					code: 'co',
					name: 'Cabinet Office',
					paymentMethods: [],
				},
			},
		})
		request.session!.save = callback => {
			callback(undefined)
		}

		const response = mockRes()
		const next = sinon.stub()
		csrsServiceStub.getOrgHierarchy.withArgs(123).throws(new ResourceNotFoundError('organisation unit not found'))
		await requiresDepartmentHierarchy(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(response.redirect).to.have.been.calledOnceWith('/profile/organisation')
	})
})
