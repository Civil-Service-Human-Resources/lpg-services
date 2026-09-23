import {expect} from 'chai'
import {plainToInstance} from 'class-transformer'
import {Category} from './category'

describe('Category model tests', () => {
	it('should correctly deserialize courseCount and linkCount', () => {
		const payload = {
			title: 'Leadership',
			description: 'Leadership category description',
			url: 'leadership',
			courseCount: 5,
			linkCount: 2,
			categories: [],
		}

		const category = plainToInstance(Category, payload)

		expect(category.title).to.equal('Leadership')
		expect(category.courseCount).to.equal(5)
		expect(category.linkCount).to.equal(2)
	})

	it('should handle missing courseCount and linkCount gracefully', () => {
		const payload = {
			title: 'Management',
			description: 'Management category description',
			url: 'management',
			categories: [],
		}

		const category = plainToInstance(Category, payload)

		expect(category.title).to.equal('Management')
		expect(category.courseCount).to.equal(undefined)
		expect(category.linkCount).to.equal(undefined)
	})
})
