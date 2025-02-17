import {range} from 'lodash'
import {Course} from '../../../lib/model'
import {assert} from 'chai'
import {CourseSearchResponse} from '../../../lib/service/catalog/models/courseSearchResponse'
import {CourseSearchQuery} from './models/courseSearchQuery'
import {getPagination} from './searchService'

describe('searchService tests', () => {
	describe('getPagination tests', () => {
		const params = new CourseSearchQuery()
		params.q = "query"
		const searchResults = new CourseSearchResponse()
		it('Should render 1 page with no prev/next links', () => {
			searchResults.results = range(0, 10).map(i => new Course(i.toString()))
			searchResults.totalResults = searchResults.results.length
			searchResults.size = 10
			searchResults.page = 0
			const res = getPagination(params, searchResults)
			assert.isUndefined(res.nextLink)
			assert.isUndefined(res.prevLink)
			assert.isEmpty(res.numberedPages)
			assert.equal(res.start, 1)
			assert.equal(res.end, 10)
			assert.equal(res.total, 10)
		})
		it('Should render 3 pages with prev/next links', () => {
			searchResults.results = range(0, 10).map(i => new Course(i.toString()))
			searchResults.totalResults = 30
			searchResults.size = 10
			searchResults.page = 1
			const res = getPagination(params, searchResults)
			assert.equal(res.nextLink, '/search?q=query&p=3')
			assert.equal(res.prevLink, '/search?q=query&p=1')
			assert.equal(res.numberedPages?.length, 3)
			assert.equal(res.start, 11)
			assert.equal(res.end, 20)
			assert.equal(res.total, 30)
		})
	})
})
