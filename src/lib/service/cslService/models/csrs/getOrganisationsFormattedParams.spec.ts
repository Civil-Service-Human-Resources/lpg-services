import {expect} from 'chai'
import {GetOrganisationsFormattedParams} from './getOrganisationsFormattedParams'

describe('getOrganisationFormattedParams tests', () => {
	describe('getCacheKey tests', () => {
		it('should generate a unique cache key when parameters are provided', () => {
			expect(new GetOrganisationsFormattedParams('test.com', [1, 2, 3]).getCacheKey()).to.equal('test.com,1,2,3')
		})
		it('should return "all" when no parameters are provided', () => {
			expect(new GetOrganisationsFormattedParams().getCacheKey()).to.equal('all')
		})
	})
})
