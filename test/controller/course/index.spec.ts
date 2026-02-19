import {expect} from 'chai'
import * as asyncHandler from 'express-async-handler'
import * as sinon from 'sinon'
import * as request from 'supertest'
import * as catalog from '../../../src/lib/service/catalog'
import * as courseController from '../../../src/ui/controllers/course'
import {
	BasicCoursePage,
	BlendedCoursePage,
	CourseDetails,
	CoursePage,
	SingleModuleCoursePage,
} from '../../../src/ui/controllers/course/models/coursePage'
import * as coursePageModelFactory from '../../../src/ui/controllers/course/models/factory'
import {BaseModuleCard, F2FModuleCard, FileModuleCard} from '../../../src/ui/controllers/course/models/moduleCard'
import {assertCourseDetails} from '../../utils/htmlAssertions/assertLearningRecordDetails'
import {
	assertModuleCard,
	getCTAAssertion,
	getCTALinkButtonAssertion,
	getLinkCTAAssertion,
} from '../../utils/htmlAssertions/assertModuleCard'
import {
	assertH1,
	assertHtml,
	classAssertion,
	getAssertNotificationBanner,
	getBackLinkAssertion,
	idAssertion,
	TextContainsAsserter,
	TextContentAsserter,
	titleAssertion,
} from '../../utils/htmlUtils'
import {getApp} from '../../utils/testApp'

describe('Course controller tests', () => {
	const sandbox = sinon.createSandbox()
	const app = getApp()
	app.get('/courses/:courseId', asyncHandler(courseController.loadCourse), asyncHandler(courseController.display))

	let catalogStub: sinon.SinonStubbedInstance<typeof catalog>
	let coursePageModelFactoryStub: sinon.SinonStubbedInstance<typeof coursePageModelFactory>

	beforeEach(() => {
		coursePageModelFactoryStub = sandbox.stub(coursePageModelFactory)
		catalogStub = sandbox.stub(catalog)
		catalogStub.get.resolves({})
	})
	afterEach(() => {
		sandbox.restore()
	})
	describe('Render course overview tests', () => {
		const makeRequest = async (coursePageMock: BasicCoursePage) => {
			coursePageModelFactoryStub.getCoursePage.resolves(coursePageMock)
			const res = await request(app).get('/courses/courseId').set({roles: 'LEARNER'})
			expect(res.status).eql(200)
			return res
		}
		const basicCourseData: CoursePage = {
			title: 'Test title',
			description: 'Test description',
			learningOutcomes: 'Test Learning outcomes',
			status: 'Published',
		}
		const details: CourseDetails = {
			cost: 100,
			duration: '1 hour',
			grades: ['G7', 'G6'],
			areasOfWork: ['Analysis', 'Policy'],
			location: 'London',
		}
		const basicModuleDetails = {
			title: 'Module title',
			description: 'Module description',
			associatedLearning: false,
			isMandatory: false,
			mustConfirmBooking: false,
			launchLink: `/courses/courseID/moduleID`,
			duration: '1 minute',
			cost: 1,
			displayMandatoryStatus: true,
		}
		describe('base layout tests', () => {
			const noModuleCoursePage: BasicCoursePage = {
				template: 'noModules',
				...basicCourseData,
			}
			it('Should render the base course overview layout', async () => {
				const res = await makeRequest(noModuleCoursePage)
				assertHtml(res.text, [assertH1('Test title'), titleAssertion('Test title')])
				expect(res.text).contain('Test description').contain('Test Learning outcomes')
			})
			it('Should exclude the learning outcomes header when there are no learning outcomes', async () => {
				const res = await makeRequest({
					template: 'noModules',
					...basicCourseData,
					learningOutcomes: '',
				})
				assertHtml(res.text, [idAssertion('learning-outcomes', null)])
			})
			it('Should Show the notification banner when the course is archived', async () => {
				const res = await makeRequest({
					template: 'noModules',
					...basicCourseData,
					status: 'Archived',
				})
				assertHtml(
					res.text,
					getAssertNotificationBanner(
						'This course is no longer available.',
						"You can't start or resume this course. Previously completed courses will appear in your learning record."
					)
				)
			})
			it('Should show "Find another course" as a default backlink', async () => {
				const res = await makeRequest(noModuleCoursePage)
				assertHtml(res.text, [getBackLinkAssertion('/suggestions-for-you', 'Find another course')])
			})
			it('Should show "Back" as a backlink when a custom backlink is provided', async () => {
				const searchUrl = '/search?q=XYZ'
				coursePageModelFactoryStub.getCoursePage.resolves({
					template: 'noModules',
					...basicCourseData,
					backLink: searchUrl,
				})

				const res = await request(app)
					.get('/courses/courseId')
					.set({roles: 'LEARNER', locals: `backLink:${searchUrl}`})
				assertHtml(res.text, [getBackLinkAssertion(searchUrl, 'Back')])
			})
		})

		describe('Render no-module course overview tests', () => {
			it('Should correctly render the no-module course page', async () => {
				const noModuleCoursePage: BasicCoursePage = {
					template: 'noModules',
					...basicCourseData,
				}
				const res = await makeRequest(noModuleCoursePage)
				expect(res.text).to.contain('Unfortunately there are no modules currently available for this course')
			})
		})

		describe('Render single module course overview tests', () => {
			it('Should correctly render the elearning course page', async () => {
				const singleModuleCoursePage: SingleModuleCoursePage = {
					template: 'elearning',
					type: 'elearning',
					...details,
					...basicCourseData,
					moduleDetails: {
						...basicModuleDetails,
						mustConfirmBooking: false,
						template: 'elearning',
						type: 'elearning',
					},
				}
				const res = await makeRequest(singleModuleCoursePage)
				assertHtml(res.text, [getCTALinkButtonAssertion(`/courses/courseID/moduleID`, 'Start this learning')])
			})
			describe('Face-to-face single module course page tests', () => {
				it('Should show the cancel link when the user is booked', async () => {
					const moduleDetails: F2FModuleCard = {
						...basicModuleDetails,
						mustConfirmBooking: false,
						template: 'faceToface',
						type: 'face-to-face',
						displayState: 'CONFIRMED',
						cancellationLink: '/cancel',
						canBeBooked: false,
					}
					const singleModuleCoursePage: SingleModuleCoursePage = {
						template: 'faceToFace',
						type: 'face-to-face',
						...details,
						...basicCourseData,
						moduleDetails,
					}
					const res = await makeRequest(singleModuleCoursePage)
					expect(res.text).contains('You are already booked on this course')
					expect(res.text).contains('/cancel')
					expect(res.text).contains('Do you wish to cancel your booking?')
					expect(res.text).not.contains('View availability')
					assertHtml(res.text, [idAssertion('govuk-notification-banner-title', null), classAssertion(['notice'], null)])
				})

				it('Should show a notification banner if the course cannot be booked', async () => {
					const moduleDetails: F2FModuleCard = {
						...basicModuleDetails,
						template: 'faceToface',
						type: 'face-to-face',
						displayState: 'NULL',
						canBeBooked: false,
					}
					const singleModuleCoursePage: SingleModuleCoursePage = {
						template: 'faceToFace',
						type: 'face-to-face',
						...details,
						...basicCourseData,
						moduleDetails,
					}
					const res = await makeRequest(singleModuleCoursePage)
					assertHtml(
						res.text,
						getAssertNotificationBanner('Important', 'Unfortunately there are no bookable sessions at this time.')
					)
				})

				it('Should show the launch link if the course can be booked', async () => {
					const moduleDetails: F2FModuleCard = {
						...basicModuleDetails,
						template: 'faceToface',
						type: 'face-to-face',
						displayState: 'NULL',
						canBeBooked: true,
					}
					const singleModuleCoursePage: SingleModuleCoursePage = {
						template: 'faceToFace',
						type: 'face-to-face',
						...details,
						...basicCourseData,
						moduleDetails,
					}
					const res = await makeRequest(singleModuleCoursePage)
					assertHtml(res.text, [getCTALinkButtonAssertion(`/courses/courseID/moduleID`, 'View availability')])
				})
			})

			describe('File single module course page tests', () => {
				it('Should show the download link for the file', async () => {
					const moduleDetails: FileModuleCard = {
						...basicModuleDetails,
						template: 'file',
						type: 'file',
						displayState: 'NULL',
						fileExtAndSize: 'pdf, 1KB',
						fileName: 'someFile.pdf',
					}
					const singleModuleCoursePage: SingleModuleCoursePage = {
						template: 'file',
						type: 'file',
						...details,
						...basicCourseData,
						moduleDetails,
					}
					const res = await makeRequest(singleModuleCoursePage)
					expect(res.text).contains('Download document')
					expect(res.text).contains(`<a href="/courses/courseID/moduleID">someFile.pdf</a>`)
					expect(res.text).contains('pdf, 1KB')
				})
			})

			describe('Link single module course page tests', () => {
				it('Should show the module card for the link module', async () => {
					const singleModuleCoursePage: SingleModuleCoursePage = {
						template: 'singleModule',
						type: 'link',
						...details,
						...basicCourseData,
						moduleDetails: {
							...basicModuleDetails,
							template: 'singleModule',
							type: 'link',
						},
					}
					const res = await makeRequest(singleModuleCoursePage)
					assertModuleCard(res.text, [
						{
							ctaElem: getLinkCTAAssertion('/courses/courseID/moduleID', 'Module title'),
							expDescription: 'Module description',
							expOptional: true,
							expTitle: 'Module title',
						},
					])
				})
			})
		})
		describe('Render blended course overview tests', () => {
			const linkModule: BaseModuleCard = {
				...basicModuleDetails,
				title: 'Link module',
				template: 'link',
				type: 'link',
				isMandatory: false,
				launchLink: '/launch',
				duration: '1 hour',
				cost: 0,
			}
			const f2fModule: F2FModuleCard = {
				...basicModuleDetails,
				title: 'Face to Face module',
				template: 'faceToFace',
				type: 'face-to-face',
				launchLink: '/book',
				canBeBooked: true,
				isMandatory: true,
				duration: '2 hours',
				cost: 100,
			}
			const fileModule: FileModuleCard = {
				...basicModuleDetails,
				title: 'File module',
				template: 'file',
				type: 'file',
				fileName: 'fileName',
				fileExtAndSize: 'pdf, 10KB',
				launchLink: '/launch',
				isMandatory: true,
				duration: '2 hours',
				cost: 0,
			}
			it(
				'Should disallow any action against an associated learning module if a face-to-face module is yet to be' +
					' confirmed',
				async () => {
					const blendedCourse: BlendedCoursePage = {
						...basicCourseData,
						...details,
						template: 'blended',
						type: 'blended',
						mandatoryModuleCount: 1,
						modules: [
							{
								...linkModule,
								mustConfirmBooking: true,
							},
							{
								...f2fModule,
								displayState: 'REQUESTED',
							},
						],
					}
					const res = await makeRequest(blendedCourse)
					assertModuleCard(res.text, [
						{
							expTitle: 'Link module',
							expDescription: 'Module description',
							expOptional: true,
							ctaElem: {
								querySelector: `p[style="display: inline-block"]`,
								expected: {
									content: new TextContentAsserter('Available on confirmation of a booking'),
								},
							},
							details: {
								expState: null,
								expDuration: '1 hour',
								expType: 'Link',
								expCost: 'Free',
							},
						},
						{
							expTitle: 'Face to Face module',
							expDescription: 'Module description',
							expOptional: false,
							ctaElem: getCTAAssertion('/book', 'Book', 'Face to Face module'),
							details: {
								expState: 'Requested',
								expDuration: '2 hours',
								expType: 'Face to face',
								expCost: '100',
							},
						},
					])
				}
			)
			it('Should show the download link for a file module', async () => {
				const blendedCourse: BlendedCoursePage = {
					...basicCourseData,
					...details,
					template: 'blended',
					type: 'blended',
					mandatoryModuleCount: 1,
					modules: [
						{
							...fileModule,
						},
						{
							...linkModule,
						},
					],
				}
				const res = await makeRequest(blendedCourse)
				assertModuleCard(res.text, [
					{
						expTitle: 'File module',
						expDescription: 'Module description',
						expOptional: false,
						ctaElem: getCTAAssertion('/launch', 'Download', 'File module'),
						details: {
							expState: null,
							expDuration: '2 hours',
							expType: 'file',
							expCost: null,
						},
					},
				])
			})
			it('Should show a message if a face-to-face module cannot be booked', async () => {
				const f2f = {
					...f2fModule,
					canBeBooked: false,
				}
				const blendedCourse: BlendedCoursePage = {
					...basicCourseData,
					...details,
					template: 'blended',
					type: 'blended',
					mandatoryModuleCount: 1,
					modules: [
						f2f,
						{
							...linkModule,
						},
					],
				}
				const res = await makeRequest(blendedCourse)
				assertModuleCard(res.text, [
					{
						expTitle: 'Face to Face module',
						expDescription: 'Module description',
						expOptional: false,
						ctaElem: {
							querySelector: 'div.discite__action.discite__action--module',
							expected: {
								content: new TextContainsAsserter('Unfortunately there are no bookable sessions at this time.'),
							},
						},
						details: {
							expState: null,
							expDuration: '2 hours',
							expType: 'Face to face',
							expCost: '100',
						},
					},
				])
			})
		})
		describe('Render courseDetails tests', () => {
			it('Should generate the correct data within the course details macro', async () => {
				const singleModuleCoursePage: SingleModuleCoursePage = {
					template: 'singleModule',
					type: 'link',
					...basicCourseData,
					...details,
					moduleDetails: {
						...basicModuleDetails,
						template: 'singleModule',
						type: 'link',
					},
				}
				const res = await makeRequest(singleModuleCoursePage)
				assertCourseDetails(res.text, {
					expCost: '£100 (ex VAT)',
					expDuration: '1 hour',
					expGrades: ['Grade 7,\n        \n            Grade 6.'],
					expLocation: 'London',
					expAreasOfWork: ['Analysis', 'Policy'],
					expType: 'Link',
				})
			})
		})
	})
})
