import {expect} from 'chai'
import {OrganisationalUnit, User} from 'lib/model'
import {AreaOfWork} from 'lib/registry'
import {getMiddleware} from 'lib/ui/profileChecker'
import * as sinon from 'sinon'
import {mockReq, mockRes} from 'sinon-express-mock'
import {profilePages} from '../../ui/controllers/profile'
import {profileSessionObjectService} from '../../ui/controllers/profile/pages/common'
// import {profileSessionObjectService} from '../../ui/controllers/profile/pages/common'

const createUser = (
	name?: string, organisation?: OrganisationalUnit, areaOfWork?: AreaOfWork,
	otherAreasOfWork?: AreaOfWork[]) => {
	return new User('id', [], 'access-token', 'username', 'userid', areaOfWork,
		undefined, otherAreasOfWork, undefined, name, organisation, undefined)
}

const requiredSections = profilePages.filter(p => p.setupDetails.required)
const middleware = getMiddleware(requiredSections)

const runMiddleware = (user: User, url?: string) => {
	url = url === undefined ? '/home' : url
	const request = mockReq({
		originalUrl: url,
		url,
		user,
	})
	const res = mockRes()
	const next = sinon.stub()
	middleware(request, res, next)
	return {
		next, request, res,
	}
}

describe('Profile checker tests', () => {
	it('Should redirect to the name section', () => {
		const user = createUser()
		const result = runMiddleware(user)
		expect(result.res.redirect.firstCall.args[0]).to.eql('/profile/name')
		const sessionObject = profileSessionObjectService.fetchObjectFromSession(result.request)
		expect(sessionObject.firstTimeSetup).to.eql(true)
		expect(sessionObject.originalUrl).to.eql('/home')
	})
	it('Should redirect to the organisation section', () => {
		const user = createUser('name')
		const result = runMiddleware(user)
		expect(result.res.redirect.firstCall.args[0]).to.eql('/profile/organisation')
		const sessionObject = profileSessionObjectService.fetchObjectFromSession(result.request)
		expect(sessionObject.firstTimeSetup).to.eql(true)
		expect(sessionObject.originalUrl).to.eql('/home')
	})
	it('Should redirect to the primary of work section', () => {
		const user = createUser('name', new OrganisationalUnit())
		const result = runMiddleware(user)
		expect(result.res.redirect.firstCall.args[0]).to.eql('/profile/primary-area-of-work')
		const sessionObject = profileSessionObjectService.fetchObjectFromSession(result.request)
		expect(sessionObject.firstTimeSetup).to.eql(true)
		expect(sessionObject.originalUrl).to.eql('/home')
	})
	it('Should redirect to the other areas of work section', () => {
		const user = createUser('name', new OrganisationalUnit(), new AreaOfWork(1, ''))
		const result = runMiddleware(user)
		expect(result.res.redirect.firstCall.args[0]).to.eql('/profile/other-areas-of-work')
		const sessionObject = profileSessionObjectService.fetchObjectFromSession(result.request)
		expect(sessionObject.firstTimeSetup).to.eql(false)
		expect(sessionObject.originalUrl).to.eql('/home')
	})
	it('Should NOT redirect when the profile is complete', () => {
		const user = createUser('name', new OrganisationalUnit(), new AreaOfWork(1, ''),
			[new AreaOfWork(1, '')])
		const result = runMiddleware(user)
		expect(result.res.redirect.notCalled).to.eql(true)
		const sessionObject = profileSessionObjectService.fetchObjectFromSession(result.request)
		expect(sessionObject).to.eql(undefined)
		expect(result.next.calledOnce).to.eq(true)
	})
	it('Should NOT redirect when accessing a profile endpoint', () => {
		const user = createUser()
		const result = runMiddleware(user, '/profile/name')
		expect(result.res.redirect.notCalled).to.eql(true)
		const sessionObject = profileSessionObjectService.fetchObjectFromSession(result.request)
		expect(sessionObject.firstTimeSetup).to.eql(true)
		expect(sessionObject.originalUrl).to.eql(undefined)
	})
})
