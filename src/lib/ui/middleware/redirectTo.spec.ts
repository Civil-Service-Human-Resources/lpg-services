import * as chai from 'chai'
import {expect} from 'chai'
import {mockReq, mockRes} from 'sinon-express-mock'
import {getMiddlewareGET, getMiddlewarePOST} from './redirectTo'
import * as sinonChai from 'sinon-chai'
chai.use(sinonChai)

describe('Redirect to tests', () => {
	it('Should store the redirect on a GET request for a valid endpoint match', () => {
		const mw = getMiddlewareGET(['/courses'])
		const request = mockReq({
			originalUrl: '/endpoint/something',
			baseUrl: '/endpoint/something',
			query: {
				redirectTo: '/courses/XYZ',
			},
			method: 'GET',
		})
		const response = mockRes()
		mw(request, response, (): void => {
			return
		})
		expect(request.session!.redirectTo!.redirectTo).to.eql('/courses/XYZ')
		expect(request.session!.redirectTo!.destination).to.eql('/endpoint/something')
	})
	it('Should not store the redirect on a GET request for an invalid endpoint match', () => {
		const mw = getMiddlewareGET(['/courses'])
		const request = mockReq({
			originalUrl: '/endpoint/something',
			baseUrl: '/endpoint/something',
			query: {
				redirectTo: '/suggestions-for-you',
			},
			method: 'GET',
		})
		const response = mockRes()
		mw(request, response, (): void => {
			return
		})
		expect(request.session!.redirectTo!).to.eql(undefined)
	})
	it('Should redirect after a POST request if the redirect is valid', () => {
		const mw = getMiddlewarePOST()
		const request = mockReq({
			originalUrl: '/endpoint/something',
			baseUrl: '/endpoint/something',
			method: 'POST',
			session: {
				redirectTo: {
					destination: '/endpoint/something',
					redirectTo: '/courses/XYZ',
				},
			},
		})
		const response = mockRes()
		mw(request, response, (): void => {
			return
		})
		expect(response.redirect).calledWith('http://localhost:3001/courses/XYZ')
	})
})
