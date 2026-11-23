import {within} from '@testing-library/dom'
import * as asyncHandler from 'express-async-handler'
import * as sinon from 'sinon'
import {client} from '../../../src/lib/service/cslService/baseConfig'
import * as courseCatalogue from '../../../src/ui/controllers/courseCatalogue/index'
import {assertLearningCards} from '../../utils/htmlAssertions/assertLearningCard'
import {getApp} from '../../utils/testApp'
import {getDOM} from '../helpers'

describe('Course catalogue controller tests', () => {
	const sandbox = sinon.createSandbox()
	const app = getApp()
	app.get('/course-catalogue', asyncHandler(courseCatalogue.renderCourseCatalogue))
	app.get('/course-catalogue/a-z/:letter', asyncHandler(courseCatalogue.renderAtoZ))
	app.get('/course-catalogue/profile-preferences', asyncHandler(courseCatalogue.profilePreferencesPage))
	app.get('/course-catalogue/popular-courses/area-of-work', asyncHandler(courseCatalogue.renderPopularProfession))

	let cslServiceClientStub: sinon.SinonStubbedInstance<typeof client>

	beforeEach(() => {
		cslServiceClientStub = sandbox.stub(client)
	})
	afterEach(() => {
		sandbox.restore()
	})

	const mockCourses = [
		{
			id: 'a1',
			title: 'A course 1',
			shortDescription: 'Short description of A course 1',
			type: 'link',
			duration: 3600,
			moduleCount: 1,
			costInPounds: 0,
			status: 'IN_PROGRESS',
		},
		{
			id: 'a2',
			title: 'A course 2',
			shortDescription: 'Short description of A course 2',
			type: 'blended',
			duration: 3600,
			moduleCount: 2,
			costInPounds: 0,
			status: 'NULL',
		},
	]

	const mockCourseAssertions = [
		{
			cta: {
				primary: {
					href: '/courses/a1',
					text: 'View A course 1 course details',
				},
				secondary: {
					text: 'Already in your learning plan',
				},
			},
			properties: {
				type: 'Link',
				duration: '1 hour',
				cost: 'Free',
			},
			expTitle: {
				text: 'A course 1',
				href: '/courses/a1',
			},
			moduleCount: 1,
			expDescription: 'Short description of A course 1',
		},
		{
			cta: {
				primary: {
					href: '/courses/a2',
					text: 'View A course 2 course details',
				},
				secondary: {
					href: '/course-catalogue/add/a2',
					text: 'Add to learning plan : A course 2',
				},
			},
			properties: {
				type: 'Blended',
				duration: '1 hour',
				cost: 'Free',
			},
			expTitle: {
				text: 'A course 2',
				href: '/courses/a2',
			},
			moduleCount: 2,
			expDescription: 'Short description of A course 2',
		},
	]

	it('Should default to the letter A of the catalogue when accessing index', async () => {
		cslServiceClientStub._get
			.withArgs(
				{
					url: `/learning/catalogue/a-z/a`,
					params: {
						page: 0,
						size: 20,
					},
				},
				sinon.match.any
			)
			.resolves({
				results: mockCourses,
			})

		const res = await getDOM(app, '/course-catalogue')
		assertLearningCards(res, mockCourseAssertions)
	})

	describe('Profile preferences tests', () => {
		it('should display profile preference courses', async () => {
			cslServiceClientStub._get
				.withArgs(
					{
						url: `/learning/catalogue/suggestions`,
						params: {
							size: null,
							excludeLearningPlanCourses: false,
						},
					},
					sinon.match.any
				)
				.resolves({
					suggestions: [
						{
							title: 'Organisation 1',
							courses: mockCourses,
						},
					],
				})

			const res = await getDOM(app, '/course-catalogue/profile-preferences')
			assertLearningCards(res, mockCourseAssertions)
		})
		it('should display a message when there are no courses', async () => {
			cslServiceClientStub._get
				.withArgs(
					{
						url: `/learning/catalogue/suggestions`,
						params: {
							size: null,
							excludeLearningPlanCourses: false,
						},
					},
					sinon.match.any
				)
				.resolves({
					suggestions: [
						{
							title: 'Organisation 1',
							courses: [],
						},
					],
				})

			const res = await getDOM(app, '/course-catalogue/profile-preferences')
			within(res).getByRole('heading', {name: 'From Organisation 1'})
			within(res).getByText('There are no suggested courses for this section at this time.')
		})
	})
	describe('Courses by letter tests', () => {
		it('should display courses beginning with a specific letter', async () => {
			cslServiceClientStub._get
				.withArgs(
					{
						url: `/learning/catalogue/a-z/d`,
						params: {
							page: 1,
							size: 20,
						},
					},
					sinon.match.any
				)
				.resolves({
					results: mockCourses,
					totalResults: mockCourses.length,
					page: 1,
					size: mockCourses.length,
				})
			const res = await getDOM(app, '/course-catalogue/a-z/d?p=2')
			within(res).getByRole('heading', {name: 'From Browse courses A to Z'})
			within(res).getByRole('heading', {name: 'Courses beginning with the letter D'})
			assertLearningCards(res, mockCourseAssertions)
		})
		it('should display a message when there are no courses for the specific letter', async () => {
			cslServiceClientStub._get
				.withArgs(
					{
						url: `/learning/catalogue/a-z/d`,
						params: {
							page: 0,
							size: 20,
						},
					},
					sinon.match.any
				)
				.resolves({
					results: [],
					totalResults: 0,
					page: 0,
					size: 0,
				})
			const res = await getDOM(app, '/course-catalogue/a-z/d')
			within(res).getByText('There are no courses beginning with the letter “D” at this time.')
		})
	})
	describe('Popular courses in your area of work tests', () => {
		it('should display courses for the users area of work', async () => {
			cslServiceClientStub._get.resolves({
				results: mockCourses,
				totalResults: mockCourses.length,
				page: 1,
				size: mockCourses.length,
			})
			const res = await getDOM(app, '/course-catalogue/popular-courses/area-of-work')
			within(res).getByRole('heading', {name: 'From Top completed courses for my area of work'})
			assertLearningCards(res, mockCourseAssertions)
		})
		it('should display a message when there are no courses for the area of work', async () => {
			cslServiceClientStub._get.resolves({
				results: [],
				totalResults: 0,
				page: 0,
				size: 0,
			})
			const res = await getDOM(app, '/course-catalogue/popular-courses/area-of-work')
			within(res).getByText('There are no suggested courses for this section at this time.')
		})
	})
})
