import {expect} from 'chai'
import * as express from 'express'
import * as nunjucks from 'nunjucks'
import * as nunjucksMiddleware from './middleware/nunjucks'

describe('categoryCard macro tests', () => {
	let app: express.Express

	beforeEach(() => {
		app = express()
		nunjucksMiddleware.register(app)
	})

	const renderCategoryCard = (params: any) => {
		const template = `
			{% from "nsg/components/categoryCard/macro.njk" import categoryCard %}
			{{ categoryCard(params) }}
		`
		return nunjucks.renderString(template, {params})
	}

	it('should render title, description, and custom classes', () => {
		const rendered = renderCategoryCard({
			title: 'Leadership',
			description: 'Develop leadership skills',
			fullUrl: '/topics/leadership',
			classes: 'category-card--first',
			categories: [],
		})

		expect(rendered).to.include('category-card--first')
		expect(rendered).to.include('Leadership')
		expect(rendered).to.include('Develop leadership skills')
	})

	describe('when sub-categories exist', () => {
		const subCategories = [
			{href: '/topics/digital/data', text: 'Data'},
			{href: '/topics/digital/agile', text: 'Agile'},
		]

		it('should render Topics heading and sub-category links list', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				description: 'Digital skills',
				categories: subCategories,
			})

			expect(rendered).to.include('Topics')
			expect(rendered).to.include("href='/topics/digital/data'")
			expect(rendered).to.include('Data')
			expect(rendered).to.include("href='/topics/digital/agile'")
			expect(rendered).to.include('Agile')
			expect(rendered).to.not.include('View topics')
		})

		it('should render "View {title} courses and links" anchor when hasDirectContent is true', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				hasDirectContent: true,
				categories: subCategories,
			})

			expect(rendered).to.include('View Digital courses and links')
			expect(rendered).to.include("href='/topics/digital'")
		})

		it('should render "View {title} courses and links" anchor when courseCount > 0', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				courseCount: 2,
				linkCount: 0,
				categories: subCategories,
			})

			expect(rendered).to.include('View Digital courses and links')
		})

		it('should render "View {title} courses and links" anchor when linkCount > 0', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				courseCount: 0,
				linkCount: 1,
				categories: subCategories,
			})

			expect(rendered).to.include('View Digital courses and links')
		})

		it('should render "View {title} courses and links" anchor when totalCourses > 0', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				totalCourses: 3,
				categories: subCategories,
			})

			expect(rendered).to.include('View Digital courses and links')
		})

		it('should render "View {title} courses and links" anchor when totalLinks > 0', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				totalLinks: 4,
				categories: subCategories,
			})

			expect(rendered).to.include('View Digital courses and links')
		})

		it('should render "View {title} courses and links" anchor when totalContent > 0', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				totalContent: 5,
				categories: subCategories,
			})

			expect(rendered).to.include('View Digital courses and links')
		})

		it('should not render "View {title} courses and links" when no direct courses or links exist', () => {
			const rendered = renderCategoryCard({
				title: 'Digital',
				fullUrl: '/topics/digital',
				courseCount: 0,
				linkCount: 0,
				totalCourses: 0,
				totalLinks: 0,
				totalContent: 0,
				hasDirectContent: false,
				categories: subCategories,
			})

			expect(rendered).to.not.include('View Digital courses and links')
			expect(rendered).to.not.include('View topics')
			expect(rendered).to.include('Topics')
			expect(rendered).to.include('Data')
		})
	})

	describe('when no sub-categories exist', () => {
		it('should render "View topics" anchor linking to fullUrl', () => {
			const rendered = renderCategoryCard({
				title: 'Finance',
				fullUrl: '/topics/finance',
				description: 'Finance overview',
				courseCount: 0,
				linkCount: 0,
				categories: [],
			})

			expect(rendered).to.include('View topics')
			expect(rendered).to.include("href='/topics/finance'")
			expect(rendered).to.not.include('View Finance courses and links')
			expect(rendered).to.not.include('Topics')
		})
	})
})
