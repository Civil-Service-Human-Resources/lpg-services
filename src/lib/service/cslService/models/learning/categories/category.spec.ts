import {expect} from 'chai'
import {plainToInstance} from 'class-transformer'
import {NSG_FLAG} from '../../../../../config'
import {Category} from './category'
import {CategoryLink} from './categoryLink'

describe('Category model tests', () => {
	describe('plainToInstance transformation', () => {
		it('should transform plain object into Category instance with API group', () => {
			const plain = {
				title: 'Digital',
				description: 'Digital skills description',
				url: 'digital-skills',
				categories: [
					{
						text: 'Data analysis',
						link: 'data-analysis',
					},
				],
				courseCount: 3,
				linkCount: 2,
				totalCourses: 5,
				totalLinks: 4,
				totalContent: 9,
				hasDirectContent: true,
			}

			const instance = plainToInstance(Category, plain, {groups: ['api']})

			expect(instance).to.be.instanceOf(Category)
			expect(instance.title).to.equal('Digital')
			expect(instance.description).to.equal('Digital skills description')
			expect(instance.url).to.equal(`${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/digital-skills`)
			expect(instance.categories).to.have.lengthOf(1)
			expect(instance.categories[0]).to.be.instanceOf(CategoryLink)
			expect(instance.categories[0].text).to.equal('Data analysis')
			expect(instance.categories[0].link).to.equal('data-analysis')
			expect(instance.categories[0].href).to.equal(`${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/data-analysis`)
			expect(instance.courseCount).to.equal(3)
			expect(instance.linkCount).to.equal(2)
			expect(instance.totalCourses).to.equal(5)
			expect(instance.totalLinks).to.equal(4)
			expect(instance.totalContent).to.equal(9)
			expect(instance.hasDirectContent).to.equal(true)
		})

		it('should default categories to an empty array when not provided in plain object', () => {
			const plain = {
				title: 'Finance',
				description: 'Finance description',
				url: 'finance',
			}

			const instance = plainToInstance(Category, plain, {groups: ['api']})

			expect(instance.categories).to.eql([])
		})
	})

	describe('getHasDirectContent tests', () => {
		it('should return true if hasDirectContent is explicitly true', () => {
			const category = new Category()
			category.hasDirectContent = true
			category.courseCount = 0
			category.linkCount = 0
			expect(category.getHasDirectContent()).to.equal(true)
		})

		it('should return false if hasDirectContent is explicitly false, even if courseCount > 0', () => {
			const category = new Category()
			category.hasDirectContent = false
			category.courseCount = 5
			expect(category.getHasDirectContent()).to.equal(false)
		})

		it('should return true if courseCount > 0 and hasDirectContent is undefined', () => {
			const category = new Category()
			category.courseCount = 2
			expect(category.getHasDirectContent()).to.equal(true)
		})

		it('should return true if linkCount > 0 and hasDirectContent is undefined', () => {
			const category = new Category()
			category.linkCount = 3
			expect(category.getHasDirectContent()).to.equal(true)
		})

		it('should return true if totalCourses > 0 and hasDirectContent is undefined', () => {
			const category = new Category()
			category.totalCourses = 4
			expect(category.getHasDirectContent()).to.equal(true)
		})

		it('should return true if totalLinks > 0 and hasDirectContent is undefined', () => {
			const category = new Category()
			category.totalLinks = 1
			expect(category.getHasDirectContent()).to.equal(true)
		})

		it('should return true if totalContent > 0 and hasDirectContent is undefined', () => {
			const category = new Category()
			category.totalContent = 6
			expect(category.getHasDirectContent()).to.equal(true)
		})

		it('should return false if all counts are 0 and hasDirectContent is undefined', () => {
			const category = new Category()
			category.courseCount = 0
			category.linkCount = 0
			category.totalCourses = 0
			category.totalLinks = 0
			category.totalContent = 0
			expect(category.getHasDirectContent()).to.equal(false)
		})

		it('should return false if all fields are undefined', () => {
			const category = new Category()
			expect(category.getHasDirectContent()).to.equal(false)
		})
	})
})
