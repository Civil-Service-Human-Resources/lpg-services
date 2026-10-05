import {within} from '@testing-library/dom'
import {expect} from 'chai'
import * as asyncHandler from 'express-async-handler'
import * as sinon from 'sinon'
import {CourseStatus, CourseType, ModuleType} from '../../../src/lib/model'
import {client} from '../../../src/lib/service/cslService/baseConfig'
import {
	CourseOverview,
	LearningPlanStatus,
} from '../../../src/lib/service/cslService/models/learning/courseOverview/courseOverview'
import {RecordState} from '../../../src/lib/service/cslService/models/record'
import * as courseController from '../../../src/ui/controllers/course'
import {assertCourseDetails} from '../../utils/htmlAssertions/assertLearningRecordDetails'
import {assertModuleCards} from '../../utils/htmlAssertions/assertModuleCard'
import {assertBackLink, assertButton, assertNotificationBanner} from '../../utils/htmlUtils'
import {getApp} from '../../utils/testApp'
import {getDOM} from '../helpers'

describe('Course controller tests', () => {
	const sandbox = sinon.createSandbox()
	const app = getApp()
	app.get('/courses/:courseId', asyncHandler(courseController.display))

	let cslServiceClientStub: sinon.SinonStubbedInstance<typeof client>

	beforeEach(() => {
		cslServiceClientStub = sandbox.stub(client)
	})
	afterEach(() => {
		sandbox.restore()
	})

	const makeRequest = async (courseOverview: CourseOverview) => {
		cslServiceClientStub._get.withArgs({
			url: '/courses/courseId/overview'
		}).resolves(courseOverview)
		return await getDOM(app, '/courses/courseId')
	}
	describe('Render course overview tests', () => {
		const basicCourseData = {
			id: 'courseID',
			title: 'Test title',
			description: 'Test description',
			learningOutcomes: 'Test Learning outcomes',
			isInLearningPlan: 'NOT_IN_LEARNING_PLAN' as LearningPlanStatus,
			status: 'PUBLISHED' as CourseStatus,
			costInPounds: 100,
			duration: 3600,
			grades: ['G7', 'G6'],
			areasOfWork: ['Analysis', 'Policy'],
			learningTags: [{id: 1, name: 'Learning Tag 1', urlSlug: 'learning-tag-1'}],
			moduleDetails: undefined
		}
		const basicModuleDetails = {
			id: 'moduleID',
			state: 'NULL' as RecordState,
			title: 'Module title',
			description: 'Module description',
			associatedLearning: false,
			mandatory: false,
			mustConfirmBooking: false,
			duration: 7200,
			costInPounds: 100,
		}
		const basicF2FModuleDetails = {
			...basicModuleDetails,
			type: 'face-to-face' as ModuleType,
			bookedEventId: 'eventId',
			canBeBooked: false,
			canBeCancelled: false,
		}
		const basicFileModuleDetails = {
			...basicModuleDetails,
			type: 'file' as ModuleType,
			filename: 'file',
			extension: 'txt',
			sizeInKb: '1000',
		}
		const getNoModulesCourse = () => {
			return {
				...basicCourseData,
				modules: [],
				mandatoryModuleCount: 0,
				type: 'unknown' as CourseType,
			}
		}
		describe('base layout tests', () => {
			it('Should render the base course overview layout', async () => {
				const res = await makeRequest(getNoModulesCourse())
				const withinRes = within(res)
				withinRes.getByRole('heading', {name: 'Test title'})
				withinRes.getByText('Test description')
				withinRes.getByText('Test Learning outcomes')
			})
			it('Should exclude the learning outcomes header when there are no learning outcomes', async () => {
				const res = await makeRequest({
					...getNoModulesCourse(),
					learningOutcomes: '',
				})
				expect(res.querySelector('#learning-outcomes')).to.eql(null)
			})
			it('Should Show the notification banner when the course is archived', async () => {
				const res = await makeRequest({
					...getNoModulesCourse(),
					status: 'Archived',
				})
				assertNotificationBanner(
					res,
					'This course is no longer available.',
					"You can't start or resume this course. Previously completed courses will appear in your learning record."
				)
			})
			it('Should show "Find another course" as a default backlink', async () => {
				const res = await makeRequest(getNoModulesCourse())
				assertBackLink(res, '/course-catalogue', 'Find another course')
			})
			it('Should show "Back" as a backlink when a custom backlink is provided', async () => {
				const searchUrl = '/search?q=XYZ'
				await makeRequest({
					...getNoModulesCourse()
				})

				const res = await getDOM(app, '/courses/courseId', {roles: 'LEARNER', locals: `backLink:${searchUrl}`})
				assertBackLink(res, searchUrl, 'Back')
			})
		})

		describe('Render no-module course overview tests', () => {
			it('Should correctly render the no-module course page', async () => {
				const res = await makeRequest(getNoModulesCourse())
				within(res).getByText('Unfortunately there are no modules currently available for this course')
			})
		})

		describe('Render single module course overview tests', () => {
			it('Should correctly render the elearning course page', async () => {
				const singleModuleCoursePage = {
					...getNoModulesCourse(),
					type: 'elearning' as CourseType,
					modules: [{...basicModuleDetails, type: 'elearning' as ModuleType}],
				}
				const res = await makeRequest(singleModuleCoursePage)
				assertButton(res, 'Start this learning', `/courses/courseID/moduleID`)
			})
			describe('Face-to-face single module course page tests', () => {
				it('Should show the cancel link when the user is booked', async () => {
					const singleModuleCoursePage = {
						...getNoModulesCourse(),
						type: 'face-to-face' as CourseType,
						modules: [
							{
								...basicF2FModuleDetails,
								state: 'CONFIRMED' as RecordState,
								canBeCancelled: true,
								canBeBooked: false,
								mustConfirmBooking: false,
								bookedEventId: 'eventID',
							},
						],
					}
					const res = await makeRequest(singleModuleCoursePage)
					const resWithin = within(res)
					expect(
						resWithin.getByRole('link', {name: 'Do you wish to cancel your booking?'}).getAttribute('href')
					).to.eql('/book/courseID/moduleID/eventID/cancel')
					assertNotificationBanner(res, null, null)
				})

				it('Should show a notification banner if the course cannot be booked', async () => {
					const singleModuleCoursePage = {
						...getNoModulesCourse(),
						type: 'face-to-face' as CourseType,
						modules: [
							{
								...basicF2FModuleDetails,
								state: 'NULL' as RecordState,
								canBeCancelled: false,
								canBeBooked: false,
								mustConfirmBooking: false,
								bookedEventId: 'eventID',
							},
						],
					}
					const res = await makeRequest(singleModuleCoursePage)
					assertNotificationBanner(res, 'Important', 'Unfortunately there are no bookable sessions at this time.')
				})

				it('Should show the launch link if the course can be booked', async () => {
					const singleModuleCoursePage = {
						...getNoModulesCourse(),
						type: 'face-to-face' as CourseType,
						modules: [
							{
								...basicF2FModuleDetails,
								state: 'NULL' as RecordState,
								canBeCancelled: false,
								canBeBooked: true,
								mustConfirmBooking: false,
								bookedEventId: 'eventID',
							},
						],
					}
					const res = await makeRequest(singleModuleCoursePage)
					assertButton(res, 'View availability', `/courses/courseID/moduleID/choose-date`)
				})
			})

			describe('File single module course page tests', () => {
				it('Should show the download link for the file', async () => {
					const singleModuleCoursePage = {
						...getNoModulesCourse(),
						type: 'file' as CourseType,
						modules: [
							{
								...basicFileModuleDetails,
								state: 'NULL' as RecordState,
							},
						],
					}
					const res = await makeRequest(singleModuleCoursePage)
					const withinRes = within(res)
					withinRes.getByRole('heading', {name: 'Download document'})
					expect(withinRes.getByRole('link', {name: 'file'}).getAttribute('href')).to.eql('/courses/courseID/moduleID')
					withinRes.getByText('(txt, 1000 KB)')
				})
			})

			describe('Link single module course page tests', () => {
				it('Should show the module card for the link module', async () => {
					const singleModuleCoursePage = {
						...getNoModulesCourse(),
						type: 'link' as CourseType,
						modules: [
							{
								...basicModuleDetails,
								state: 'NULL' as RecordState,
								type: 'link' as ModuleType,
								mandatory: false,
							},
						],
					}
					const res = await makeRequest(singleModuleCoursePage)
					assertModuleCards(res, [
						{
							cta: {
								type: 'button',
								text: 'Go to Module title (opens in a new tab)',
								href: '/courses/courseID/moduleID',
							},
							expDescription: 'Module description',
							expOptional: false,
							expTitle: 'Module title',
						},
					])
				})
			})
		})
		describe('Render blended course overview tests', () => {
			const linkModule = {
			...basicModuleDetails,
				title: 'Link module',
				state: 'NULL' as RecordState,
				type: 'link' as ModuleType,
				mandatory: false,
			}

			const f2fModule = {
				...basicF2FModuleDetails,
				title: 'Face to Face module',
				state: 'NULL' as RecordState,
				canBeBooked: true,
				mandatory: true,
			}
			const fileModule = {
			...basicFileModuleDetails,
				state: 'NULL' as RecordState,
				mandatory: true,
				title: 'File module',
			}
			const videoModule = {
			...basicModuleDetails,
				type: 'video' as ModuleType,
				title: 'Video module',
				state: 'NULL' as RecordState,
				mandatory: false,
			}
			it(
				'Should disallow any action against an associated learning module if a face-to-face module is yet to be' +
					' confirmed',
				async () => {
					const blendedCourse = {
						...basicCourseData,
						template: 'blended',
						type: 'blended' as CourseType,
						mandatoryModuleCount: 1,
						modules: [
							{
								...linkModule,
								mustConfirmBooking: true,
								costInPounds: 0,
							},
							{
								...f2fModule,
								state: 'REQUESTED' as RecordState
							},
						],
					}
					const res = await makeRequest(blendedCourse)
					assertModuleCards(res, [
						{
							expTitle: 'Link module',
							expDescription: 'Module description',
							expOptional: true,
							cta: {
								type: 'text',
								text: 'Available on confirmation of a booking',
							},
							details: {
								expState: null,
								expDuration: '2 hours',
								expType: 'Link',
								expCost: 'Free',
							},
						},
						{
							expTitle: 'Face to Face module',
							expDescription: 'Module description',
							expOptional: false,
							cta: {
								type: 'button',
								text: 'Book Face to Face module',
								href: '/book',
							},
							details: {
								expState: 'Requested',
								expDuration: '2 hours',
								expType: 'Face to face',
								expCost: '£100',
							},
						},
					])
				}
			)
			it('Should show the download link for a file module', async () => {
				const blendedCourse = {
					...basicCourseData,
					type: 'blended' as CourseType,
					mandatoryModuleCount: 1,
					modules: [
						{
							...fileModule
						},
						{
							...linkModule,
						},
					],
				}
				const res = await makeRequest(blendedCourse)
				assertModuleCards(res, [
					{
						expTitle: 'File module',
						expDescription: 'Module description',
						expOptional: false,
						cta: {
							type: 'button',
							text: 'Download File module file',
							href: '/launch',
						},
						details: {
							expState: null,
							expDuration: '2 hours',
							expType: 'file',
							expCost: null,
						},
					},
				])
			})
			it('Should show the video link for a video module', async () => {
				const blendedCourse = {
					...basicCourseData,
					type: 'blended' as CourseType,
					mandatoryModuleCount: 1,
					modules: [
						{
							...videoModule
						},
						{
							...videoModule,
						},
					],
				}
				const res = await makeRequest(blendedCourse)
				assertModuleCards(res, [
					{
						expTitle: 'Video module',
						expDescription: 'Module description',
						expOptional: false,
						cta: {
							type: 'button',
							text: 'Go to Video module video',
							href: '/launch',
						},
						details: {
							expState: null,
							expDuration: '2 hours',
							expType: 'Video',
						},
					},
				])
			})
			it('Should show a message if a face-to-face module cannot be booked', async () => {
				const f2f = {
					...f2fModule,
					canBeBooked: false
				}
				const blendedCourse = {
					...basicCourseData,
					type: 'blended' as CourseType,
					mandatoryModuleCount: 1,
					modules: [
						f2f,
						{
							...linkModule,
						},
					],
				}
				const res = await makeRequest(blendedCourse)
				assertModuleCards(res, [
					{
						expTitle: 'Face to Face module',
						expDescription: 'Module description',
						expOptional: false,
						cta: {
							type: 'text',
							text: 'Unfortunately there are no bookable sessions at this time.',
						},
						details: {
							expState: null,
							expDuration: '2 hours',
							expType: 'Face to face',
							expCost: '£100',
						},
					},
				])
			})
		})
		describe('Render courseDetails tests', () => {
			it('Should generate the correct data within the course details macro', async () => {
				const singleModuleCoursePage = {
					mandatoryModuleCount: 1,
					type: 'link' as CourseType,
					...basicCourseData,
					costInPounds: 100,
					modules: [{
						...basicModuleDetails,
						type: 'link' as ModuleType,
					}],
				}
				const res = await makeRequest(singleModuleCoursePage)
				assertCourseDetails(res, {
					expCost: '£100 (ex VAT)',
					expDuration: '1 hour',
					expGrades: ['Grade 7', 'Grade 6'],
					expAreasOfWork: ['Analysis', 'Policy'],
					expType: 'Link',
				})
			})
		})
	})
})
