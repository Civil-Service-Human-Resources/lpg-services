import {range} from 'lodash'
import {Course} from '../../../lib/model'
import {assert} from 'chai'
import {CourseSearchResponse} from '../../../lib/service/catalog/models/courseSearchResponse'
import {CourseSearchQuery} from './models/courseSearchQuery'
import {getPagination} from './searchService'

describe('searchService tests', () => {
	describe('getPagination tests', () => {
		const params = new CourseSearchQuery()
		params.q = 'query'
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
		it('Should render 7 pages with ellipses before the current page', () => {
			searchResults.results = range(0, 10).map(i => new Course(i.toString()))
			searchResults.totalResults = 80
			searchResults.size = 10
			searchResults.page = 5
			const res = getPagination(params, searchResults)
			assert.equal(res.nextLink, '/search?q=query&p=7')
			assert.equal(res.prevLink, '/search?q=query&p=5')
			assert.equal(res.numberedPages?.length, 6)
			assert.equal(res.numberedPages[0].link, '/search?q=query&p=1')
			assert.equal(res.numberedPages[1].ellipses, true)
			assert.equal(res.numberedPages[2].link, '/search?q=query&p=5')
			assert.equal(res.start, 51)
			assert.equal(res.end, 60)
			assert.equal(res.total, 80)
		})
		it('Should render 7 pages with ellipses after the current page', () => {
			searchResults.results = range(0, 10).map(i => new Course(i.toString()))
			searchResults.totalResults = 80
			searchResults.size = 10
			searchResults.page = 2
			const res = getPagination(params, searchResults)
			assert.equal(res.nextLink, '/search?q=query&p=4')
			assert.equal(res.prevLink, '/search?q=query&p=2')
			assert.equal(res.numberedPages?.length, 6)
			assert.equal(res.numberedPages[3].link, '/search?q=query&p=4')
			assert.equal(res.numberedPages[4].ellipses, true)
			assert.equal(res.numberedPages[5].link, '/search?q=query&p=8')
			assert.equal(res.start, 21)
			assert.equal(res.end, 30)
			assert.equal(res.total, 80)
		})
		it('Should render 7 pages with ellipses before and after the current page', () => {
			searchResults.results = range(0, 10).map(i => new Course(i.toString()))
			searchResults.totalResults = 80
			searchResults.size = 10
			searchResults.page = 4
			const res = getPagination(params, searchResults)
			assert.equal(res.nextLink, '/search?q=query&p=6')
			assert.equal(res.prevLink, '/search?q=query&p=4')
			assert.equal(res.numberedPages?.length, 7)
			assert.equal(res.numberedPages[0].link, '/search?q=query&p=1')
			assert.equal(res.numberedPages[1].ellipses, true)
			assert.equal(res.numberedPages[2].link, '/search?q=query&p=4')
			assert.equal(res.numberedPages[3].link, undefined)
			assert.equal(res.numberedPages[4].link, '/search?q=query&p=6')
			assert.equal(res.numberedPages[5].ellipses, true)
			assert.equal(res.numberedPages[6].link, '/search?q=query&p=8')
			assert.equal(res.start, 41)
			assert.equal(res.end, 50)
			assert.equal(res.total, 80)
		})
	})
})
