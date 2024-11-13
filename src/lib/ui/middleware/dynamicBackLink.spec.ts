import {expect} from 'chai'
import {getMiddleware} from 'lib/ui/middleware/dynamicBackLink'
import {mockReq, mockRes} from 'sinon-express-mock'

describe('Dynamic back link tests', () => {
	it('Should set the back link on an endpoint that has a valid back link', () => {
		const mw = getMiddleware(["/search"])
		const request = mockReq({
			headers: {
				referer: 'http://localhost:3001/search?q=test',
			},
		})
		const response = mockRes()
		mw(request, response, (): void => {return})
		expect(response.locals.backLink).to.eql("/search?q=test")
	})
	it('Should NOT set the back link on an endpoint that does not have a valid back link', () => {
		const mw = getMiddleware(["/learning-record"])
		const request = mockReq({
			headers: {
				referer: 'http://localhost:3001/search?q=test',
			},
		})
		const response = mockRes()
		mw(request, response, (): void => {return})
		expect(response.locals.backLink).to.eql(undefined)
	})
})
