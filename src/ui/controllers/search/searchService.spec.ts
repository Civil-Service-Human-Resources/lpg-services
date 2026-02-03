import {range} from 'lodash'
import {Course} from '../../../lib/model'
import {assert} from 'chai'
import {CourseSearchResponse} from '../../../lib/service/catalog/models/courseSearchResponse'
import {CourseSearchQuery} from './models/courseSearchQuery'
import {SearchFilterable, SearchLabel} from './models/searchPageModel'
import {getPagination, processFilters} from './searchService'

describe('searchService tests', () => {
	describe('processFilters', () => {
		class BasicSearchFilter implements SearchFilterable {
			constructor(private name: string) {}
			getAsSearchFilter(): SearchLabel {
				return {
					value: this.name,
					label: this.name,
					id: this.name,
				}
			}

			getValue(): string {
				return this.name
			}
		}
		it('should create a list of search filters', () => {
			const selectedValues = ['value1', 'value2', 'value3']
			const profileFilters: SearchFilterable[] = [new BasicSearchFilter('value1'), new BasicSearchFilter('value4')]
			const allValues: SearchFilterable[] = [
				new BasicSearchFilter('value1'),
				new BasicSearchFilter('value2'),
				new BasicSearchFilter('value3'),
				new BasicSearchFilter('value4'),
				new BasicSearchFilter('value5'),
			]
			const result = processFilters(selectedValues, profileFilters, allValues)
			assert.equal(result.userSelection.length, 2)
			assert.equal(result.otherSelection.length, 3)

			assert.equal(result.userSelection[0].value, 'value1')
			assert.equal(result.userSelection[0].checked, true)
			assert.equal(result.userSelection[1].value, 'value4')
			assert.equal(result.userSelection[1].checked, false)

			assert.equal(result.otherSelection[0].value, 'value2')
			assert.equal(result.otherSelection[0].checked, true)
			assert.equal(result.otherSelection[1].value, 'value3')
			assert.equal(result.otherSelection[1].checked, true)
			assert.equal(result.otherSelection[2].value, 'value5')
			assert.equal(result.otherSelection[2].checked, false)
		})
	})
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
			assert.equal(res.currentPage, 1)
			assert.equal(res.totalPages, 1)
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
			assert.equal(res.currentPage, 2)
			assert.equal(res.totalPages, 3)
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
			assert.equal(res.currentPage, 6)
			assert.equal(res.totalPages, 8)
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
			assert.equal(res.currentPage, 3)
			assert.equal(res.totalPages, 8)
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
			assert.equal(res.currentPage, 5)
			assert.equal(res.totalPages, 8)
		})
	})
})
