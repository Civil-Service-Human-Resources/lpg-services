import {expect} from 'chai'
import * as asyncHandler from 'express-async-handler'
import * as sinon from 'sinon'
import * as request from 'supertest'
import {client} from '../../../src/lib/service/cslService/baseConfig'
import {setCaches} from '../../../src/lib/service/cslService/cslServiceClient'
import * as index from '../../../src/ui/controllers/home'
import {assertBanner} from '../../utils/htmlAssertions/assertBanner'

import {assertCourseCards} from '../../utils/htmlAssertions/assertCourseCard'
import {assertH1, assertHtml, titleAssertion} from '../../utils/htmlUtils'
import {fakeCache} from '../../utils/mocks'
import {getApp} from '../../utils/testApp'

describe('Homepage controller tests', () => {
	const sandbox = sinon.createSandbox()
	const app = getApp()
	app.get('/home', asyncHandler(index.home))

	let cslServiceStub: sinon.SinonStubbedInstance<typeof client>
	// let requiredLearningCache: sinon.SinonStubbedInstance<RequiredLearningCache>

	beforeEach(() => {
		cslServiceStub = sandbox.stub(client)
		cslServiceStub._get.resolves({})
	})
	afterEach(() => {
		sandbox.restore()
	})

	const stubGetLearningPlan = (response: any) => {
		cslServiceStub._get
			.withArgs(
				{
					url: '/learning/plan',
				},
				sinon.match.any
			)
			.resolves(response)
	}

	const stubGetRequiredLearning = (response: any) => {
		cslServiceStub._get
			.withArgs(
				{
					url: '/learning/required',
				},
				sinon.match.any
			)
			.resolves(response)
	}

	setCaches(fakeCache as any, fakeCache as any, fakeCache as any, fakeCache as any)

	const makeRequest = async () => {
		const res = await request(app).get('/home').set({roles: 'LEARNER'})
		expect(res.statusCode).to.equal(200)
		assertHtml(res.text, [assertH1('Your learning'), titleAssertion('Your learning')])
		return res
	}

	describe('Required learning', () => {
		it('should render required learning', async () => {
			stubGetRequiredLearning({
				userId: 'userId',
				courses: [
					{
						id: 'required1',
						title: 'Required Course 1',
						shortDescription: 'Short description of required course 1',
						type: 'blended',
						duration: 3600,
						moduleCount: 5,
						costInPounds: 0,
						status: 'IN_PROGRESS',
						dueBy: '2025-01-01',
					},
				],
			})
			const res = await makeRequest()
			console.log(res.text)
			assertCourseCards(res.text, [
				{
					dueBy: '01 Jan 2025',
					cta: {
						primary: {
							href: '/courses/required1#modules',
							text: 'Start',
						},
					},
					properties: {
						type: 'Blended',
						duration: '1 hour',
						statusBadge: 'In progress',
					},
					expTitle: {
						text: 'Required Course 1',
						href: '/courses/required1',
					},
					moduleCount: 5,
					expDescription: 'Short description of required course 1',
				},
			])
		})
		it('should render the correct messaging when the user has no required learning', async () => {
			stubGetRequiredLearning({userId: 'userId', courses: []})
			const res = await makeRequest()
			expect(res.text).to.contain('<p>You have completed all your required learning.</p>')
		})
	})
	describe('Learning plan', () => {
		it('should render the learning plan', async () => {
			stubGetLearningPlan({
				userId: 'userId',
				learningPlanCourses: [
					{
						id: 'learningplan1',
						title: 'Learning plan Course 1',
						shortDescription: 'Short description of learning plan 1',
						type: 'link',
						duration: 3600,
						moduleCount: 1,
						costInPounds: 0,
						status: 'IN_PROGRESS',
					},
					{
						id: 'learningplan2',
						title: 'Learning plan Course 2',
						shortDescription: 'Short description of learning plan 2',
						type: 'face-to-face',
						duration: 3600,
						moduleCount: 1,
						costInPounds: 10,
						status: 'NULL',
					},
				],
			})
			const res = await request(app)
				.get('/home')
				.set({
					roles: 'LEARNER',
					flashes: ['successTitle:Learning plan Course 2', 'successId:learningplan2', 'successMessage:success'],
				})
			assertCourseCards(res.text, [
				{
					cta: {
						primary: {
							href: '/courses/learningplan1#modules',
							text: 'Start',
						},
						secondary: {
							href: '/home?delete=learningplan1',
							text: 'Remove',
						},
					},
					properties: {
						type: 'Link',
						duration: '1 hour',
						statusBadge: 'In progress',
						cost: 'Free',
					},
					expTitle: {
						text: 'Learning plan Course 1',
						href: '/courses/learningplan1',
					},
					moduleCount: 1,
					expDescription: 'Short description of learning plan 1',
				},
				{
					cta: {
						primary: {
							href: '/courses/learningplan2#modules',
							text: 'Start',
						},
						secondary: {
							href: '/home?delete=learningplan2',
							text: 'Remove',
						},
					},
					properties: {
						type: 'Face to face',
						duration: '1 hour',
						statusBadge: 'Just added',
						cost: '£10 (ex VAT)',
					},
					expTitle: {
						text: 'Learning plan Course 2',
						href: '/courses/learningplan2',
					},
					moduleCount: 1,
					expDescription: 'Short description of learning plan 2',
				},
			])
			assertBanner(res.text, {
				title: 'Learning plan Course 2',
				message: 'success',
			})
		})
		it('should render booked learning', async () => {
			stubGetLearningPlan({
				userId: 'userId',
				bookedCourses: [
					{
						id: 'bookedLearning1',
						title: 'Booked learning Course 1',
						shortDescription: 'Short description of booked learning 1',
						type: 'blended',
						duration: 3600,
						moduleCount: 2,
						costInPounds: 0,
						status: 'IN_PROGRESS',
						eventModule: {
							id: 'moduleId',
							bookedDate: '2025-01-02',
							eventId: 'eventId',
							title: 'Module title',
							dates: ['2025-01-02', '2025-01-03'],
							state: 'REQUESTED',
						},
					},
				],
			})
			const res = await makeRequest()
			assertCourseCards(res.text, [
				{
					cta: {
						primary: {
							href: '/courses/bookedLearning1#modules',
							text: 'Start',
						},
					},
					properties: {
						type: 'Blended',
						duration: '1 hour',
						cost: 'Free',
					},
					expTitle: {
						text: 'Booked learning Course 1',
						href: '/courses/bookedLearning1',
					},
					moduleCount: 2,
					expDescription: 'Short description of booked learning 1',
					eventModule: {
						dates: ['02 Jan 2025', '03 Jan 2025'],
						status: 'Requested',
						title: {
							text: 'Module title',
							href: '/courses/bookedLearning1',
						},
						type: 'Face to face',
						cta: {
							text: 'Cancel booking',
							href: '/book/bookedLearning1/moduleId/eventId/cancel',
						},
					},
				},
			])
		})
		it('should render the correct messaging when there is no learning plan', async () => {
			stubGetLearningPlan({
				userId: 'userId',
				courses: [],
			})
			const res = await makeRequest()
			expect(res.text).to.contain('<p class="govuk-body">There is currently no learning in your plan.</p>')
			expect(res.text).to.contain(
				'<p class="govuk-body">You can add learning by checking <a href="/suggestions-for-you">Suggestions for you</a> or <a href="/search?q=">searching for a specific course</a>.</p>'
			)
		})
		it('Should prompt the user to confirm when they remove a course from the learning plan', async () => {
			stubGetLearningPlan({
				userId: 'userId',
				learningPlanCourses: [
					{
						id: 'learningplan1',
						title: 'Learning plan Course 1',
						shortDescription: 'Short description of learning plan 1',
						type: 'link',
						duration: 3600,
						moduleCount: 1,
						costInPounds: 0,
						status: 'IN_PROGRESS',
					},
				],
			})
			const res = await request(app).get('/home?delete=learningplan1').set({roles: 'LEARNER'})
			assertBanner(res.text, {
				title: 'Are you sure you want to remove Learning plan Course 1?',
				message: 'If you remove this course, it will be deleted from your learning plan',
				actions: [
					{
						text: 'Yes, remove course now.',
						href: '/courses/learningplan1/delete',
					},
					{
						text: 'No, keep it.',
						href: '/',
					},
				],
			})
		})
		describe('Move / Skip banner tests', () => {
			beforeEach(() => {
				stubGetLearningPlan({
					userId: 'userId',
					bookedCourses: [
						{
							id: 'bookedLearning1',
							title: 'Booked learning Course 1',
							shortDescription: 'Short description of booked learning 1',
							type: 'blended',
							duration: 3600,
							moduleCount: 2,
							costInPounds: 0,
							status: 'IN_PROGRESS',
							eventModule: {
								id: 'moduleId',
								bookedDate: '2025-01-02',
								eventId: 'eventId',
								title: 'Module title',
								dates: ['2025-01-02', '2025-01-03'],
								state: 'REQUESTED',
							},
						},
					],
				})
			})
			it('Should prompt the user to confirm when they move a face-to-face course to their learning record', async () => {
				const res = await request(app).get('/home?move=bookedLearning1,moduleId,eventId').set({roles: 'LEARNER'})
				assertBanner(res.text, {
					title: 'Are you sure you want to add Booked learning Course 1 to your learning record?',
					message: 'You should only add it to your learning record if you attended it.',
					actions: [
						{
							text: 'Yes, add it',
							href: '/book/bookedLearning1/moduleId/eventId/move',
						},
						{
							text: 'No',
							href: '/',
						},
					],
				})
			})
			it('Should prompt the user to confirm when they skip a face-to-face course', async () => {
				const res = await request(app).get('/home?skip=bookedLearning1,moduleId,eventId').set({roles: 'LEARNER'})
				assertBanner(res.text, {
					title: 'Are you sure you want to say you did not attend Booked learning Course 1?',
					message: 'Are you sure you did not attend? This will remove it from your learning plan',
					actions: [
						{
							text: 'Yes, remove it',
							href: '/book/bookedLearning1/moduleId/eventId/skip',
						},
						{
							text: 'No, keep it',
							href: '/',
						},
					],
				})
			})
		})
	})
})
