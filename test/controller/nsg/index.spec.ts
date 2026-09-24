import {within} from '@testing-library/dom'
import {expect} from 'chai'
import {Express} from 'express'
import {LearningCategoryCache} from '../../../src/lib/service/cslService/cache/learningCategoryCache'
import {setCaches} from '../../../src/lib/service/cslService/cslServiceClient'
import {CategoryHomepage} from '../../../src/lib/service/cslService/models/learning/categories/categoryHomepage'
import {CategoryPage} from '../../../src/lib/service/cslService/models/learning/categories/categoryPage'
import {CategoryLink} from '../../../src/lib/service/cslService/models/learning/categories/categoryLink'
import {Response} from '../../../src/lib/utils/search'
import {setSimpleCache, SimpleCache} from '../../../src/lib/utils/simpleCache'
import * as index from '../../../src/ui/controllers/nsg/controller'
import * as sinon from 'sinon'
import {client} from '../../../src/lib/service/cslService/baseConfig'
import {assertBreadcrumbs} from '../../utils/htmlAssertions/assertBreadcrumbs'
import {assertCategories} from '../../utils/htmlAssertions/assertHomepageCategory'
import {getApp} from '../../utils/testApp'
import {getDOM} from '../helpers'

describe('Homepage controller tests', () => {
	const sandbox = sinon.createSandbox()
	const app = getApp()
	app.use('/nsg-homepage', index.router)

	let cslServiceStub: sinon.SinonStubbedInstance<typeof client>
	let learningCategoryCacheStub: sinon.SinonStubbedInstance<LearningCategoryCache>
	let simpleCacheStub: sinon.SinonStubbedInstance<SimpleCache>

	beforeEach(() => {
		simpleCacheStub = sandbox.stub(new SimpleCache({} as any, 0))
		learningCategoryCacheStub = sandbox.stub(new LearningCategoryCache({} as any, 0))
		setCaches({} as any, {} as any, {} as any, {} as any, learningCategoryCacheStub as any)
		setSimpleCache(simpleCacheStub as any)
		cslServiceStub = sandbox.stub(client)
		cslServiceStub._get.resolves({})
	})
	afterEach(() => {
		sandbox.restore()
	})

	async function makeRequest(e: Express, url: string) {
		return getDOM(e, url, {roles: 'LEARNING_TAG_MANAGER'})
	}

	const getEmptyContentResponse = <T>(): Response<T> => {
		return {
			results: [],
			page: 0,
			size: 0,
			totalResults: 0,
		}
	}

	const genericCategoryPage = () => {
		const categoryPage = new CategoryPage()
		categoryPage.title = 'Subcategory 1'
		categoryPage.description = 'This is Subcategory 1'
		const parent = new CategoryLink()
		parent.link = 'category-1'
		parent.text = 'Category 1'
		categoryPage.parents = [parent]
		categoryPage.categories = [
			{
				title: 'Sub Subcategory 1',
				description: 'this is sub-subcategory 1',
				url: 'sub-subcategory-1',
				categories: [],
				getHasDirectContent: (): boolean => {
					throw new Error('Function not implemented.')
				},
			},
		]
		categoryPage.courses = getEmptyContentResponse()
		categoryPage.courseCount = 0
		categoryPage.links = getEmptyContentResponse()
		categoryPage.linkCount = 0
		return categoryPage
	}

	it('should render the homepage title card', async () => {
		const homepageObject = new CategoryHomepage()
		homepageObject.categories = []
		cslServiceStub._get.resolves(homepageObject)

		const res = await makeRequest(app, '/nsg-homepage')
		within(res).getByRole('heading', {name: 'Welcome to the National School of Government and Public Services.'})
		within(res).getByText(
			'The National School provides world-class learning and development for civil servants, supporting public sector excellence and preparing our people for the future.'
		)
	})

	it('should render the homepage and any tier 1 categories', async () => {
		const homepageObject = new CategoryHomepage()
		homepageObject.categories = [
			{
				title: 'Category 1',
				description: 'this is category 1',
				url: 'category-1',
				categories: [],
				getHasDirectContent: (): boolean => {
					throw new Error('Function not implemented.')
				},
			},
			{
				title: 'Category 2',
				description: 'this is category 2',
				url: 'category-2',
				categories: [],
				getHasDirectContent: (): boolean => {
					throw new Error('Function not implemented.')
				},
			},
		]
		cslServiceStub._get.resolves(homepageObject)

		const res = await makeRequest(app, '/nsg-homepage')
		assertCategories(res, [
			{
				expTitle: 'Category 1',
				expDescription: 'this is category 1',
				expUrl: `/nsg-homepage/topics/category-1`,
			},
			{
				expTitle: 'Category 2',
				expDescription: 'this is category 2',
				expUrl: `/nsg-homepage/topics/category-2`,
			},
		])
	})

	it('should render "View topics" links on homepage even if tier 1 categories have subcategories and content', async () => {
		const homepageObject = new CategoryHomepage()
		homepageObject.categories = [
			{
				title: 'Universal Skills',
				description: 'These are universal skills',
				url: 'universal-skills',
				categories: [
					{
						text: 'Working in Government',
						link: 'working-in-government',
						href: '/nsg-homepage/topics/working-in-government',
					},
				],
				courseCount: 3,
				linkCount: 2,
				hasDirectContent: true,
			} as any,
		]
		cslServiceStub._get.resolves(homepageObject)

		const res = await makeRequest(app, '/nsg-homepage')
		const card = within(res.getElementsByClassName('category-card')[0] as HTMLElement)
		card.getByRole('heading', {name: 'Universal Skills'})
		card.getByText('These are universal skills')
		const link = card.getByRole('link', {name: 'View topics'})
		expect(link.getAttribute('href')).to.eql('/nsg-homepage/topics/universal-skills')
		expect(card.queryByRole('link', {name: 'View Universal Skills courses and links'})).to.eql(null)
		expect(card.queryByRole('heading', {name: 'Topics'})).to.eql(null)
		expect(card.queryByRole('link', {name: 'Working in Government'})).to.eql(null)
	})

	it('should render the subcategories for a tier 1', async () => {
		const categoryPage = genericCategoryPage()
		cslServiceStub._get.resolves(categoryPage)

		const res = await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
		within(res).getByRole('heading', {name: 'Subcategory 1'})
		within(res).getByText('This is Subcategory 1')
		assertBreadcrumbs(res, [
			{
				expHref: '/nsg-homepage',
				expText: 'Home',
			},
			{
				expHref: `/nsg-homepage/topics/category-1`,
				expText: 'Category 1',
			},
		])
		assertCategories(res, [
			{
				expTitle: 'Sub Subcategory 1',
				expDescription: 'this is sub-subcategory 1',
				expUrl: `/nsg-homepage/topics/sub-subcategory-1`,
			},
		])
	})

	it('should render subcategory card with "View [Category Name] courses and links" when subcategory has sub-tags and direct courses/links', async () => {
		const categoryPage = genericCategoryPage()
		categoryPage.categories = [
			{
				title: 'Sub Subcategory 1',
				description: 'this is sub-subcategory 1',
				url: 'sub-subcategory-1',
				categories: [
					{
						text: 'Tier 3 Subcategory',
						link: 'tier-3-subcategory',
						href: '/nsg-homepage/topics/tier-3-subcategory',
					},
				],
				courseCount: 5,
				linkCount: 0,
			} as any,
		]
		cslServiceStub._get.resolves(categoryPage)

		const res = await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
		const card = within(res.getElementsByClassName('category-card')[0] as HTMLElement)
		card.getByRole('heading', {name: 'Sub Subcategory 1'})
		const link = card.getByRole('link', {name: 'View Sub Subcategory 1 courses and links'})
		link.getAttribute('href')
		expect(link.getAttribute('href')).to.eql('/nsg-homepage/topics/sub-subcategory-1')
		card.getByRole('heading', {name: 'Topics'})
		card.getByRole('link', {name: 'Tier 3 Subcategory'})
	})

	it('should hide category link and only show sub-tags when subcategory has sub-tags but no direct courses/links', async () => {
		const categoryPage = genericCategoryPage()
		categoryPage.categories = [
			{
				title: 'Personal Effectiveness',
				description: 'this is personal effectiveness',
				url: 'personal-effectiveness',
				categories: [
					{
						text: 'Tier 3 Subcategory',
						link: 'tier-3-subcategory',
						href: '/nsg-homepage/topics/tier-3-subcategory',
					},
				],
				courseCount: 0,
				linkCount: 0,
			} as any,
		]
		cslServiceStub._get.resolves(categoryPage)

		const res = await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
		const card = within(res.getElementsByClassName('category-card')[0] as HTMLElement)
		card.getByRole('heading', {name: 'Personal Effectiveness'})
		expect(card.queryByRole('link', {name: 'View Personal Effectiveness courses and links'})).to.eql(null)
		expect(card.queryByRole('link', {name: 'View topics'})).to.eql(null)
		card.getByRole('heading', {name: 'Topics'})
		card.getByRole('link', {name: 'Tier 3 Subcategory'})
	})

	it('should hide sub-topic tiles and only show courses/links when topic has sub-topics and courses/links', async () => {
		const categoryPage = genericCategoryPage()
		categoryPage.courseCount = 1
		categoryPage.courses = {
			page: 0,
			size: 20,
			totalResults: 1,
			results: [
				{
					title: 'Course 1',
					status: 'IN_PROGRESS',
					id: '1',
					costInPounds: 0,
					duration: 1,
					moduleCount: 1,
					type: 'blended',
					shortDescription: 'Course 1',
				},
			],
		}
		categoryPage.categories = [
			{
				title: 'Sub Subcategory 1',
				description: 'this is sub-subcategory 1',
				url: 'sub-subcategory-1',
				categories: [],
			} as any,
		]
		cslServiceStub._get.resolves(categoryPage)

		const res = await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
		expect(res.getElementsByClassName('category-card__container').length).to.eql(0)
		within(res).getByRole('heading', {name: 'Courses'})
		within(res).getByRole('heading', {name: 'Course 1'})
	})

	describe('content', () => {
		it('should render courses within a category page', async () => {
			const categoryPage = genericCategoryPage()
			categoryPage.courseCount = 23
			categoryPage.courses = {
				page: 0,
				size: 20,
				totalResults: 23,
				results: Array.from({length: 20}, (_, i) => i).map(i => {
					return {
						title: `Course ${i}`,
						status: 'IN_PROGRESS',
						id: `${i}`,
						costInPounds: 0,
						duration: 1,
						moduleCount: 1,
						type: 'blended',
						shortDescription: `Course ${i}`,
					}
				}),
			}
			categoryPage.linkCount = 0
			cslServiceStub._get.resolves(categoryPage)
			const res = await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
			within(res).getByRole('heading', {name: 'Courses'})
			within(res).getByRole('heading', {name: 'Course 1'})
			within(res).getByText('Showing 1 – 20 of 23 items')
			within(res).getByRole('link', {name: 'Page 2'})
			within(res).getByRole('link', {name: 'Next page'})
		})

		it('should render links within a category page', async () => {
			const categoryPage = genericCategoryPage()
			categoryPage.linkCount = 23
			categoryPage.links = {
				page: 0,
				size: 20,
				totalResults: 23,
				results: Array.from({length: 20}, (_, i) => i).map(i => {
					return {
						title: `Link ${i}`,
						href: `https://link${i}`,
						description: `Link ${i}`,
					}
				}),
			}
			cslServiceStub._get.resolves(categoryPage)
			const res = await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
			within(res).getByRole('heading', {name: 'Links'})
			within(res).getByRole('heading', {name: 'Link 1'})
			within(res).getByText('Showing 1 – 20 of 23 items')
			within(res).getByRole('link', {name: 'Page 2'})
			within(res).getByRole('link', {name: 'Next page'})
		})

		it('should render links and courses in tabs within a category page (link view)', async () => {
			const categoryPage = genericCategoryPage()
			categoryPage.linkCount = 23
			categoryPage.links = {
				page: 0,
				size: 20,
				totalResults: 23,
				results: Array.from({length: 20}, (_, i) => i).map(i => {
					return {
						title: `Link ${i}`,
						href: `https://link${i}`,
						description: `Link ${i}`,
					}
				}),
			}
			categoryPage.courseCount = 3
			cslServiceStub._get.resolves(categoryPage)
			const res = await makeRequest(app, `/nsg-homepage/topics/subcategory-1/links`)
			within(res).getByRole('heading', {name: 'Links (23)'})
			within(res).getByRole('heading', {name: 'Courses (3)'})
			within(res).getByRole('heading', {name: 'Link 1'})
			within(res).getByText('Showing 1 – 20 of 23 items')
			within(res).getByRole('link', {name: 'Page 2'})
			within(res).getByRole('link', {name: 'Next page'})
		})
	})
	describe('Cache', () => {
		it('should fetch category pages from the cache and not the API', async () => {
			const categoryPage = genericCategoryPage()
			learningCategoryCacheStub.get.resolves(categoryPage)
			await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
			expect(cslServiceStub._get.called).to.eq(false)
		})
		it('should not cache category pages that have courses within them', async () => {
			const categoryPage = genericCategoryPage()
			categoryPage.courseCount = 23
			categoryPage.courses = {
				page: 0,
				size: 20,
				totalResults: 23,
				results: Array.from({length: 20}, (_, i) => i).map(i => {
					return {
						title: `Course ${i}`,
						status: 'IN_PROGRESS',
						id: `${i}`,
						costInPounds: 0,
						duration: 1,
						moduleCount: 1,
						type: 'blended',
						shortDescription: `Course ${i}`,
					}
				}),
			}
			categoryPage.linkCount = 0
			cslServiceStub._get.resolves(categoryPage)
			await makeRequest(app, `/nsg-homepage/topics/subcategory-1`)
			expect(learningCategoryCacheStub.setObject.called).to.eq(false)
		})
	})
})
