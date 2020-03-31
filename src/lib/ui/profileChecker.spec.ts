import {expect} from 'chai'
import * as chai from 'chai'
import {NextFunction} from 'express'
import {ForceOrgChange} from 'lib/model'
import {beforeEach} from 'mocha'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import {mockReq, mockRes} from 'sinon-express-mock'
import {ProfileChecker} from './profileChecker'

chai.use(sinonChai)

describe('ProfileChecker tests', () => {
	let profileChecker: ProfileChecker

	beforeEach(() => {
		profileChecker = new ProfileChecker()
	})

	it('should recognise profile requests', () => {
		const request = mockReq()
		const paths = [
			'/profile/name',
			'/profile/organisation',
			'/profile/profession',
			'/profile/otherAreasOfWork',
		]

		for (const path of paths) {
			request.path = path

			/* tslint:disable-next-line:no-unused-expression */
			expect(profileChecker.isProfileRequest(request)).to.be.true
		}
	})

	it('should redirect to profile name page if givenName is missing from profile', () => {
		const request = mockReq({
			originalUrl: '/home',
			user: {},
		})
		request.session!.save = callback => {
			callback(undefined)
		}

		const response = mockRes()
		/* tslint:disable-next-line:no-angle-bracket-type-assertion */
		const next = <NextFunction> {}
		const check = profileChecker.checkProfile()
		check(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(response.redirect).to.have.been.calledOnceWith('/profile/name?originalUrl=/home')
	})

	it('should redirect to profile organisation page if organisationalUnit is missing from profile', () => {
		const request = mockReq({
			originalUrl: '/home',
			user: {
				forceOrgChange: new ForceOrgChange(false),
				givenName: 'Test User',
			},
		})
		request.session!.save = callback => {
			callback(undefined)
		}

		const response = mockRes()
		/* tslint:disable-next-line:no-angle-bracket-type-assertion */
		const next = <NextFunction> {}
		const check = profileChecker.checkProfile()
		check(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(response.redirect).to.have.been.calledOnceWith('/profile/organisation?originalUrl=/home')
	})

	it('should redirect to profile organisation page if department is missing from profile', () => {
		const request = mockReq({
			originalUrl: '/home',
			user: {
				forceOrgChange: new ForceOrgChange(false),
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
		/* tslint:disable-next-line:no-angle-bracket-type-assertion */
		const next = <NextFunction> {}
		const check = profileChecker.checkProfile()
		check(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(response.redirect).to.have.been.calledOnceWith('/profile/organisation?originalUrl=/home')
	})

	it('should redirect to profile profession page if areasOfWork is missing from profile', () => {
		const request = mockReq({
			originalUrl: '/home',
			user: {
				department: 'co',
				forceOrgChange: new ForceOrgChange(false),
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
		/* tslint:disable-next-line:no-angle-bracket-type-assertion */
		const next = <NextFunction> {}
		const check = profileChecker.checkProfile()
		check(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(response.redirect).to.have.been.calledOnceWith('/profile/profession?originalUrl=/home')
	})

	it('should redirect to profile otherAreasOfWork page if otherAreasOfWork is missing from profile', () => {
		const request = mockReq({
			originalUrl: '/home',
			user: {
				areasOfWork: [
					1, 'Analysis',
				],
				department: 'co',
				forceOrgChange: new ForceOrgChange(false),
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
		/* tslint:disable-next-line:no-angle-bracket-type-assertion */
		const next = <NextFunction> {}
		const check = profileChecker.checkProfile()
		check(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(response.redirect).to.have.been.calledOnceWith('/profile/otherAreasOfWork?originalUrl=/home')
	})

	it('should redirect to profile interests page if interests is missing from profile', () => {
		const request = mockReq({
			originalUrl: '/home',
			user: {
				areasOfWork: [
					1, 'Analysis',
				],
				department: 'co',
				forceOrgChange: new ForceOrgChange(false),
				givenName: 'Test User',
				organisationalUnit: {
					code: 'co',
					name: 'Cabinet Office',
					paymentMethods: [],
				},
				otherAreasOfWork: [
					{
						id: 2,
						name: 'Commercial',
					},
				],
			},
		})
		request.session!.save = callback => {
			callback(undefined)
		}

		const response = mockRes()
		/* tslint:disable-next-line:no-angle-bracket-type-assertion */
		const check = profileChecker.checkProfile()
		const next = sinon.stub()
		check(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(next).to.have.been.calledOnce
	})

	it('should call next if mandatory sections of profile are complete', () => {
		const request = mockReq({
			originalUrl: '/home',
			user: {
				areasOfWork: [
					1, 'Analysis',
				],
				department: 'co',
				forceOrgChange: new ForceOrgChange(false),
				givenName: 'Test User',
				interests: [
					{
						name: 'Leadership',
					},
				],
				organisationalUnit: {
					code: 'co',
					name: 'Cabinet Office',
					paymentMethods: [],
				},
				otherAreasOfWork: [
					{
						id: 2,
						name: 'Commercial',
					},
				],
			},
		})
		request.session!.save = callback => {
			callback(undefined)
		}

		const response = mockRes()
		const next = sinon.stub()
		const check = profileChecker.checkProfile()
		check(request, response, next)
		/* tslint:disable-next-line:no-unused-expression */
		expect(next).to.have.been.calledOnce
	})
})
