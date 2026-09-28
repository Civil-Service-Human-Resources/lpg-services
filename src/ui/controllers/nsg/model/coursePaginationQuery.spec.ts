import {expect} from 'chai'
import {plainToInstance} from 'class-transformer'
import {CoursePaginationQuery} from './coursePaginationQuery'

describe('CoursePaginationQuery', () => {
	it('should sanitize categoryUrl using striptags', () => {
		const query = plainToInstance(CoursePaginationQuery, {
			categoryUrl: '<b>topic-name</b>',
			p: 2,
			contentType: 'courses',
		})
		expect(query.categoryUrl).to.equal('topic-name')
		expect(query.p).to.equal(1)
	})

	it('should default p to 0 when missing, invalid, or negative', () => {
		const query1 = plainToInstance(CoursePaginationQuery, {
			categoryUrl: 'topic-name',
		})
		expect(query1.p).to.equal(0)

		const query2 = plainToInstance(CoursePaginationQuery, {
			categoryUrl: 'topic-name',
			p: 'invalid',
		})
		expect(query2.p).to.equal(0)

		const query3 = plainToInstance(CoursePaginationQuery, {
			categoryUrl: 'topic-name',
			p: -5,
		})
		expect(query3.p).to.equal(0)
	})

	it('should generate URL params correctly with sanitized categoryUrl', () => {
		const query = plainToInstance(CoursePaginationQuery, {
			categoryUrl: '<b>topic</b>',
			p: 2,
			contentType: 'courses',
		})
		const url = query.getAsUrlParams(3)
		expect(url).to.contain('/topics/topic/courses?p=3')
	})
})
